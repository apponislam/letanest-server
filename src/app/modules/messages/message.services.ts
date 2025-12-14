import httpStatus from "http-status";
import { ICreateConversationDto, ICreateMessageDto } from "./messages.interface";
import { Conversation, Message } from "./messages.model";
import ApiError from "../../../errors/ApiError";
import { getIO } from "../../../socket/socket";
import { emitToConversation, emitToUser } from "../../../socket/socketHandlers";
import { UserModel } from "../auth/auth.model";
import { sanitizeMessageText } from "../../../utils/contentFilter";
import { IUser } from "../auth/auth.interface";
import { ISubscription } from "../subscription/subscription.interface";

const createConversation = async (conversationData: ICreateConversationDto) => {
    const existingConversation = await Conversation.findOne({
        participants: { $all: conversationData.participants },
        isActive: true,
    });

    if (existingConversation) {
        if (existingConversation.isReplyAllowed) {
            Conversation.findByIdAndUpdate(existingConversation._id, {
                isReplyAllowed: conversationData.isReplyAllowed,
            });
        }

        await Conversation.findByIdAndUpdate(existingConversation._id, {
            updatedAt: new Date(),
        });

        return await Conversation.findById(existingConversation._id).populate("participants", "name profileImg email phone role").populate("lastMessage");
    }

    const conversation = await Conversation.create(conversationData);

    const io = getIO();
    const populatedConversation = await Conversation.findById(conversation._id).populate("participants", "name profileImg email phone role");

    conversationData.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("conversation:new", populatedConversation);
    });

    return populatedConversation;
};

const getUserConversations = async (userId: string) => {
    const conversations = await Conversation.find({
        participants: userId,
        isActive: true,
    })
        .populate("participants", "name profileImg email phone role isVerifiedByAdmin")
        .populate({
            path: "lastMessage",
            populate: {
                path: "propertyId",
                select: "title images location price propertyNumber _id createdBy",
            },
        })
        .sort({ updatedAt: -1 });

    // NEW: Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation) => {
            const unreadCount = await Message.countDocuments({
                conversationId: conversation._id,
                sender: { $ne: userId }, // Messages from other users
                isRead: false,
            });

            return {
                ...conversation.toObject(),
                unreadCount, // Add calculated unread count
            };
        })
    );

    return conversationsWithUnread;
};

const getConversationById = async (conversationId: string, userId: string) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    })
        .populate("participants", "name profileImg email phone role isVerifiedByAdmin")
        .populate({
            path: "lastMessage",
            populate: {
                path: "propertyId",
                select: "title images location price propertyNumber _id createdBy",
            },
        });

    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    return conversation;
};

const createMessage = async (messageData: ICreateMessageDto) => {
    const conversation = await Conversation.findOne({
        _id: messageData.conversationId,
        participants: messageData.sender,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Cannot send message to this conversation");
    }

    const sender = await UserModel.findById(messageData.sender).select("role").lean();
    if (sender?.role === "HOST" || sender?.role === "ADMIN") {
        await Conversation.findByIdAndUpdate(messageData.conversationId, {
            isReplyAllowed: true,
        });
    }

    let receiver;

    if (messageData.type === "offer") {
        receiver = conversation.participants.find((p) => p.toString() !== messageData.sender.toString());
    } else if (messageData.type === "request") {
        receiver = conversation.participants.find((p) => p.toString() === messageData.sender.toString());
    }

    let bookingFee = 30;

    if (receiver) {
        const receiverData = await UserModel.findById(receiver)
            .select("_id name email role phone profileImg subscriptions freeTireSub freeTireData currentSubscription")
            .populate({
                path: "freeTireSub",
                select: "_id name price duration",
            })
            .populate({
                path: "currentSubscription",
                select: "_id bookingFee commission listingLimit freeBookings bookingLimit",
            })
            .lean<IUser & { currentSubscription?: ISubscription }>();

        console.log(messageData.agreedFee);
        const agreedFeeNum = Number(messageData?.agreedFee || 0);

        if (receiverData?.currentSubscription) {
            const sub = receiverData.currentSubscription;
            if (sub.bookingLimit && sub.bookingLimit > 0) {
                bookingFee = 0;
            } else {
                bookingFee = sub.bookingFee !== undefined && sub.bookingFee !== null ? (agreedFeeNum * sub.bookingFee) / 100 : agreedFeeNum * 0.1;
            }
        } else {
            bookingFee = agreedFeeNum * 0.1;
            console.log("in condition", bookingFee);
        }
        bookingFee = Number(bookingFee.toFixed(2));
    }

    let finalMessageData = messageData;

    // Only sanitize if skip is not true
    if (!messageData.skip) {
        const sanitizedText = sanitizeMessageText(messageData.text || "");
        finalMessageData = {
            ...messageData,
            text: sanitizedText,
        };
    }

    const message = await Message.create({ ...finalMessageData, bookingFee });

    await Conversation.findByIdAndUpdate(messageData.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!populatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create message");
    }

    let unreadCountForReceiver = 0;

    if (receiver) {
        unreadCountForReceiver = await Message.countDocuments({
            conversationId: conversation._id,
            sender: { $ne: receiver },
            isRead: false,
        });
    }

    // NEW: Emit with unread count data
    emitToConversation(messageData.conversationId, "message:new", {
        message: populatedMessage,
        unreadCount: unreadCountForReceiver,
        receiverId: receiver?.toString(),
    });

    console.log(`✅ Message sent and emitted to conversation ${messageData.conversationId}`);

    return populatedMessage;
};

const getConversationMessages = async (conversationId: string, userId: string, page: number = 1, limit: number = 50) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }
    const skip = (page - 1) * limit;
    const messages = await Message.find({ conversationId })
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return messages.reverse();
};

const getMessageById = async (messageId: string, userId: string) => {
    // const message = await Message.findById(messageId).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location createdBy");
    const message = await Message.findById(messageId)
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title location createdBy coverPhoto",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this message");
    }

    return message;
};

const markMessageAsRead = async (messageId: string, userId: string) => {
    const message = await Message.findById(messageId);

    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this message");
    }

    // CHANGED: Use isRead instead of readBy
    const updatedMessage = await Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true }).populate("sender", "name profileImg email role");

    // NEW: Calculate updated unread count
    const unreadCount = await Message.countDocuments({
        conversationId: conversation._id,
        sender: { $ne: userId },
        isRead: false,
    });

    // NEW: Emit with unread count
    const io = getIO();
    io.to(message.conversationId.toString()).emit("message:read", {
        messageId,
        conversationId: message.conversationId,
        readBy: userId,
        unreadCount, // Include updated unread count
        readAt: new Date(),
    });

    return {
        success: true,
        message: "Message marked as read",
        data: updatedMessage,
    };
};

const rejectOffer = async (messageId: string, conversationId: string, userId: string) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    if (message.type !== "offer" && message.type !== "request") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only reject offer or request messages");
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }

    const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
            type: "rejected",
        },
        { new: true }
    )
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title images location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!updatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to reject offer");
    }

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });

    emitToConversation(conversationId, "message:new", updatedMessage);
    emitToConversation(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });

    console.log(`✅ Offer rejected by user ${userId}`);

    return updatedMessage;
};

const convertRequestToOffer = async (messageId: string, conversationId: string, userId: string) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    if (message.type !== "request") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only convert request messages");
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }

    const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
            type: "offer",
        },
        { new: true }
    )
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title images location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!updatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to convert request to offer");
    }

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });

    emitToConversation(conversationId, "message:new", updatedMessage);
    emitToConversation(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });

    console.log(`✅ Request converted to offer by user ${userId}`);

    return updatedMessage;
};

const convertMakeOfferToRequest = async (
    messageId: string,
    conversationId: string,
    userId: string,
    requestData: {
        checkInDate: string;
        checkOutDate: string;
        agreedFee: number;
        guestNo: string;
    }
) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    if (message.type !== "makeoffer") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only convert makeoffer messages");
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }

    let bookingFee = 0;
    const receiver = userId;
    const receiverData = await UserModel.findById(receiver).select("currentSubscription").populate("currentSubscription", "bookingFee bookingLimit").lean<IUser & { currentSubscription?: ISubscription }>();
    const agreedFeeNum = Number(requestData.agreedFee);

    if (receiverData?.currentSubscription) {
        const sub = receiverData.currentSubscription;
        if (sub.bookingLimit && sub.bookingLimit > 0) {
            bookingFee = 0;
        } else {
            bookingFee = sub.bookingFee !== undefined && sub.bookingFee !== null ? (agreedFeeNum * sub.bookingFee) / 100 : agreedFeeNum * 0.1;
        }
    } else {
        bookingFee = agreedFeeNum * 0.1;
    }
    bookingFee = Number(bookingFee.toFixed(2));

    // Update the message to request type with all data
    const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
            type: "request",
            checkInDate: requestData.checkInDate,
            checkOutDate: requestData.checkOutDate,
            agreedFee: requestData.agreedFee,
            guestNo: requestData.guestNo,
            bookingFee: bookingFee,
            bookingFeePaid: false,
        },
        { new: true }
    )
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!updatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to convert makeoffer to request");
    }

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });

    emitToConversation(conversationId, "message:new", updatedMessage);
    emitToConversation(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });

    console.log(`✅ Makeoffer converted to request by user ${userId}`);

    return updatedMessage;
};

const acceptOffer = async (messageId: string, conversationId: string, userId: string) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    if (message.type !== "offer") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only accept offers");
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }

    const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
            hostFeePaid: true,
            type: "accepted",
        },
        { new: true }
    )
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title images location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!updatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to accept offer");
    }

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });

    emitToConversation(conversationId, "message:new", updatedMessage);
    emitToConversation(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });

    console.log(`✅ Offer accepted by user ${userId}`);

    return updatedMessage;
};

/**
 * Update booking fee paid status to true
 */
const updateBookingFeePaid = async (messageId: string, conversationId: string, userId: string) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }

    const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
            bookingFeePaid: true,
        },
        { new: true }
    )
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title images location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!updatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update booking fee status");
    }

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });

    emitToConversation(conversationId, "message:new", updatedMessage);
    emitToConversation(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });

    return updatedMessage;
};

const reviewDone = async (messageId: string) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }
    const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
            reviewed: true,
        },
        { new: true }
    )
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title images location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!updatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update booking fee status");
    }
    await Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });

    emitToConversation(message.conversationId.toString(), "message:new", updatedMessage);
    emitToConversation(message.conversationId.toString(), "offer:rejected", {
        messageId: updatedMessage._id.toString(),
        conversationId: message.conversationId.toString(),
    });

    return updatedMessage;
};

const markConversationAsRead = async (conversationId: string, userId: string) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }

    // Mark all messages as read
    await Message.updateMany(
        {
            conversationId: conversationId,
            isRead: false,
            sender: { $ne: userId },
        },
        {
            isRead: true,
        }
    );

    // Get the updated conversation with recalculated unread count
    const updatedConversation = await Conversation.findById(conversationId)
        .populate("participants", "name profileImg email phone role")
        .populate({
            path: "lastMessage",
            populate: {
                path: "propertyId",
                select: "title images location price propertyNumber _id createdBy",
            },
        });

    if (!updatedConversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    // Calculate the new unread count (should be 0)
    const unreadCount = await Message.countDocuments({
        conversationId: conversationId,
        sender: { $ne: userId },
        isRead: false,
    });

    // Emit conversation read event with updated data
    const io = getIO();
    io.to(conversationId).emit("conversation:read", {
        conversationId,
        readBy: userId,
        unreadCount, // Should be 0
        conversation: updatedConversation,
    });

    // RETURN only the data, not wrapped in success/message
    return {
        conversation: updatedConversation,
        unreadCount,
    };
};

const getTotalUnreadCount = async (userId: string) => {
    const totalUnreadCount = await Message.countDocuments({
        // Messages where user is not the sender AND message is not read
        sender: { $ne: userId },
        isRead: false,
        // Make sure the message belongs to a conversation where user is a participant
        conversationId: {
            $in: await Conversation.find({
                participants: userId,
                isActive: true,
            }).distinct("_id"),
        },
    });

    return {
        totalUnreadCount,
    };
};

// This is for admin

const getConversationsByUserId = async (userId: string, page: number = 1, limit: number = 20) => {
    // Validate if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
        participants: userId,
        isActive: true,
    })
        .populate("participants", "name profileImg email phone role isVerifiedByAdmin")
        .populate({
            path: "lastMessage",
            populate: {
                path: "propertyId",
                select: "title images location price propertyNumber _id createdBy",
            },
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

    // Get total count for pagination
    const totalConversations = await Conversation.countDocuments({
        participants: userId,
        isActive: true,
    });

    // Calculate unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation) => {
            const unreadCount = await Message.countDocuments({
                conversationId: conversation._id,
                sender: { $ne: userId },
                isRead: false,
            });

            return {
                ...conversation.toObject(),
                unreadCount,
            };
        })
    );

    return {
        conversations: conversationsWithUnread,
        meta: {
            page,
            limit,
            total: totalConversations,
        },
    };
};

const getAllConversationMessages = async (conversationId: string, page: number = 1, limit: number = 100) => {
    // Verify conversation exists (admin can access any conversation)
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    const skip = (page - 1) * limit;

    // const messages = await Message.find({ conversationId }).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location createdBy images").sort({ createdAt: -1 }).skip(skip).limit(limit);
    const messages = await Message.find({ conversationId })
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title location createdBy images",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalMessages = await Message.countDocuments({ conversationId });

    return {
        messages: messages.reverse(),
        meta: {
            page,
            limit,
            total: totalMessages,
        },
        conversation: await Conversation.findById(conversationId).populate("participants", "name profileImg email phone role isVerifiedByAdmin"),
    };
};

const searchUserConversations = async (searchTerm: string, page: number = 1, limit: number = 20) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Search term must be at least 2 characters long");
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(searchTerm, "i");

    // Search users by name, email, phone
    const users = await UserModel.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
    })
        .select("_id name email phone profileImg role")
        .skip(skip)
        .limit(limit);

    const totalUsers = await UserModel.countDocuments({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
    });

    // Get conversations for each user
    const usersWithConversations = await Promise.all(
        users.map(async (user) => {
            const conversations = await Conversation.find({
                participants: user._id,
                isActive: true,
            })
                .populate("participants", "name profileImg email phone role isVerifiedByAdmin")
                .populate({
                    path: "lastMessage",
                    populate: {
                        path: "propertyId",
                        select: "title images location price propertyNumber _id createdBy",
                    },
                })
                .sort({ updatedAt: -1 });

            return {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    profileImg: user.profileImg,
                    role: user.role,
                },
                conversations: conversations,
            };
        })
    );

    return {
        results: usersWithConversations,
        meta: {
            page,
            limit,
            total: totalUsers,
        },
    };
};

const editOffer = async (messageId: string, conversationId: string, userId: string, updateData: { agreedFee?: number; checkInDate?: string; checkOutDate?: string; guestNo?: number; offerEdited: boolean }) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    // Only allow editing offer or request messages
    if (message.type !== "offer" && message.type !== "request") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only edit offer or request messages");
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }
    const updateFields: any = {};

    if (updateData.agreedFee !== undefined) {
        updateFields.agreedFee = updateData.agreedFee;
        let guest;
        if (message.type === "offer") {
            guest = conversation.participants.find((p) => p.toString() !== message.sender.toString());
        } else if (message.type === "request") {
            guest = message.sender;
        }

        if (guest) {
            const guestData = await UserModel.findById(guest).populate("currentSubscription", "bookingFee bookingLimit").lean<IUser & { currentSubscription?: ISubscription }>();

            const agreedFeeNum = Number(updateData.agreedFee);
            let bookingFee = 0;

            if (guestData?.currentSubscription) {
                const sub = guestData.currentSubscription;
                if (sub.bookingLimit && sub.bookingLimit > 0) {
                    bookingFee = 0;
                } else {
                    const feePercentage = sub.bookingFee !== undefined && sub.bookingFee !== null ? sub.bookingFee : 10;
                    bookingFee = (agreedFeeNum * feePercentage) / 100;
                }
            } else {
                bookingFee = agreedFeeNum * 0.1;
            }

            updateFields.bookingFee = Number(bookingFee.toFixed(2));
        }
    }

    if (updateData.checkInDate !== undefined) {
        updateFields.checkInDate = updateData.checkInDate;
    }

    if (updateData.checkOutDate !== undefined) {
        updateFields.checkOutDate = updateData.checkOutDate;
    }

    if (updateData.guestNo !== undefined) {
        updateFields.guestNo = updateData.guestNo;
    }

    if (updateData.offerEdited !== undefined) {
        updateFields.offerEdited = updateData.offerEdited;
    }

    // Update the message
    const updatedMessage = await Message.findByIdAndUpdate(messageId, updateFields, { new: true })
        .populate("sender", "name profileImg email phone role")
        .populate({
            path: "propertyId",
            select: "propertyNumber price title images location createdBy",
            populate: {
                path: "createdBy",
                select: "name email phone role profileImg",
            },
        });

    if (!updatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update offer");
    }

    // Update conversation's last message timestamp
    await Conversation.findByIdAndUpdate(conversationId, {
        updatedAt: new Date(),
    });

    // Emit the updated message to the conversation
    emitToConversation(conversationId, "message:new", updatedMessage);
    emitToConversation(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });

    console.log(`✅ Offer updated by user ${userId}`);

    return updatedMessage;
};

const filterConversationsByUpdatedAt = async (filter: string, page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;

    // Build filter query based on the filter parameter
    let dateFilter = {};
    const now = new Date();

    switch (filter) {
        case "24h":
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            dateFilter = { updatedAt: { $gte: last24Hours } };
            break;
        case "7d":
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { updatedAt: { $gte: last7Days } };
            break;
        case "30d":
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = { updatedAt: { $gte: last30Days } };
            break;
        case "6m":
            const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
            dateFilter = { updatedAt: { $gte: last6Months } };
            break;
        case "1y":
            const last1Year = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            dateFilter = { updatedAt: { $gte: last1Year } };
            break;
        case "all":
        default:
            // No date filter for "all"
            dateFilter = {};
            break;
    }

    // Build the complete query - ADMIN VIEW: No user filtering!
    const query = {
        isActive: true,
        ...dateFilter,
    };

    // Get conversations with pagination
    const conversations = await Conversation.find(query)
        .populate("participants", "name profileImg email phone role isVerifiedByAdmin")
        .populate({
            path: "lastMessage",
            populate: {
                path: "propertyId",
                select: "title images location price propertyNumber _id createdBy",
            },
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalConversations = await Conversation.countDocuments(query);

    return {
        conversations: conversations,
        meta: {
            page,
            limit,
            total: totalConversations,
        },
    };
};

export const messageServices = {
    createConversation,
    getUserConversations,
    getConversationById,
    createMessage,
    getConversationMessages,
    getMessageById,
    markMessageAsRead,
    rejectOffer,
    convertRequestToOffer,
    convertMakeOfferToRequest,
    acceptOffer,
    updateBookingFeePaid,

    // review done
    reviewDone,

    // Mark all messages read in conversion
    markConversationAsRead,
    getTotalUnreadCount,

    // admin routes
    getConversationsByUserId,
    getAllConversationMessages,
    searchUserConversations,

    //Edit Offer
    editOffer,

    //new route for filter admin
    filterConversationsByUpdatedAt,
};
