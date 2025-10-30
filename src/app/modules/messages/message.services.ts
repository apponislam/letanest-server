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
                select: "title images location price propertyNumber _id",
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

    let receiver;

    console.log(messageData);

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

        console.log("🎯 Receiver with subscriptions and free trial populated:", receiverData);

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

    console.log(bookingFee);

    console.log(messageData);

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

    // const message = await Message.create({ ...messageData, bookingFee });

    await Conversation.findByIdAndUpdate(messageData.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location createdBy");

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

    const messages = await Message.find({ conversationId }).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location createdBy").sort({ createdAt: -1 }).skip(skip).limit(limit);

    return messages.reverse();
};

const getMessageById = async (messageId: string, userId: string) => {
    const message = await Message.findById(messageId).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location createdBy");

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
        .populate("propertyId", "propertyNumber price title images location createdBy");

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
        .populate("propertyId", "propertyNumber price title images location createdBy");

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
            type: "accepted",
        },
        { new: true }
    )
        .populate("sender", "name profileImg email phone role")
        .populate("propertyId", "propertyNumber price title images location createdBy");

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

    const messages = await Message.find({ conversationId }).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location createdBy images").sort({ createdAt: -1 }).skip(skip).limit(limit);

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
    acceptOffer,
    // Mark all messages read in conversion
    markConversationAsRead,
    getTotalUnreadCount,

    // admin routes
    getConversationsByUserId,
    getAllConversationMessages,
    searchUserConversations,
};
