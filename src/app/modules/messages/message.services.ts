// import httpStatus from "http-status";
// import { ICreateConversationDto, ICreateMessageDto } from "./messages.interface";
// import { Conversation, Message } from "./messages.model";
// import ApiError from "../../../errors/ApiError";
// import { getIO } from "../../../socket/socket";
// import { emitToConversation, emitToUser } from "../../../socket/socketHandlers";
// import { UserModel } from "../auth/auth.model";

// const createConversation = async (conversationData: ICreateConversationDto) => {
//     // Check if conversation already exists between these participants
//     const existingConversation = await Conversation.findOne({
//         participants: { $all: conversationData.participants },
//         isActive: true,
//     });

//     if (existingConversation) {
//         // Return existing conversation instead of throwing error
//         return await Conversation.findById(existingConversation._id).populate("participants", "name profileImg email phone").populate("lastMessage");
//     }

//     const conversation = await Conversation.create(conversationData);

//     // Emit conversation created event to all participants
//     const io = getIO();
//     const populatedConversation = await Conversation.findById(conversation._id).populate("participants", "name profileImg email phone");

//     // Emit to all participants
//     conversationData.participants.forEach((participantId) => {
//         io.to(participantId.toString()).emit("conversation:new", populatedConversation);
//     });

//     return populatedConversation;
// };

// const getUserConversations = async (userId: string) => {
//     const conversations = await Conversation.find({
//         participants: userId,
//         isActive: true,
//     })
//         .populate("participants", "name profileImg email phone")
//         .populate({
//             path: "lastMessage",
//             populate: {
//                 path: "propertyId",
//                 select: "title images location price propertyNumber _id",
//             },
//         })
//         .sort({ updatedAt: -1 });

//     return conversations;
// };

// const getConversationById = async (conversationId: string, userId: string) => {
//     const conversation = await Conversation.findOne({
//         _id: conversationId,
//         participants: userId,
//         isActive: true,
//     })
//         .populate("participants", "name profileImg email phone")
//         .populate({
//             path: "lastMessage",
//             populate: {
//                 path: "propertyId",
//                 select: "title images location price propertyNumber _id",
//             },
//         });

//     if (!conversation) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
//     }

//     return conversation;
// };

// // const createMessage = async (messageData: ICreateMessageDto) => {
// //     const conversation = await Conversation.findOne({
// //         _id: messageData.conversationId,
// //         participants: messageData.sender,
// //         isActive: true,
// //     });

// //     if (!conversation) {
// //         throw new ApiError(httpStatus.FORBIDDEN, "Cannot send message to this conversation");
// //     }

// //     const receiver = conversation.participants.find((p) => p.toString() !== messageData.sender.toString());
// //     let bookingFee = 30;
// //     if (receiver) {
// //         const receiverData = await UserModel.findById(receiver)
// //             .select("_id name email role phone profileImg subscriptions freeTireSub freeTireData")
// //             // Populate the freeTireSub reference
// //             .populate({
// //                 path: "freeTireSub",
// //                 select: "_id name price duration",
// //             })

// //             .populate({
// //                 path: "subscriptions.subscription",
// //                 select: "_id bookingFee commission listingLimit freeBookings bookingLimit",
// //             });

// //         console.log("🎯 Receiver with subscriptions and free trial populated:", receiverData);
// //     }

// //     const message = await Message.create({ ...messageData, bookingFee });

// //     await Conversation.findByIdAndUpdate(messageData.conversationId, {
// //         lastMessage: message._id,
// //         updatedAt: new Date(),
// //     });

// //     const populatedMessage = await Message.findById(message._id).populate("sender", "name profileImg email phone").populate("propertyId", "propertyNumber price title location");

// //     if (!populatedMessage) {
// //         throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create message");
// //     }

// //     // Emit new message to ALL participants in the conversation
// //     emitToConversation(messageData.conversationId, "message:new", populatedMessage);

// //     console.log(`✅ Message sent and emitted to conversation ${messageData.conversationId}`);

// //     return populatedMessage;
// // };

// const createMessage = async (messageData: ICreateMessageDto) => {
//     const conversation = await Conversation.findOne({
//         _id: messageData.conversationId,
//         participants: messageData.sender,
//         isActive: true,
//     });

//     if (!conversation) {
//         throw new ApiError(httpStatus.FORBIDDEN, "Cannot send message to this conversation");
//     }

//     const receiver = conversation.participants.find((p) => p.toString() !== messageData.sender.toString());
//     let bookingFee = 30;
//     if (receiver) {
//         const receiverData = await UserModel.findById(receiver)
//             .select("_id name email role phone profileImg subscriptions freeTireSub freeTireData")
//             .populate({
//                 path: "freeTireSub",
//                 select: "_id name price duration",
//             })
//             .populate({
//                 path: "subscriptions.subscription",
//                 select: "_id bookingFee commission listingLimit freeBookings bookingLimit",
//             });
//         console.log("🎯 Receiver with subscriptions and free trial populated:", receiverData);
//     }

//     const message = await Message.create({ ...messageData, bookingFee });

//     await Conversation.findByIdAndUpdate(messageData.conversationId, {
//         lastMessage: message._id,
//         updatedAt: new Date(),
//     });

//     const populatedMessage = await Message.findById(message._id).populate("sender", "name profileImg email phone").populate("propertyId", "propertyNumber price title location");

//     if (!populatedMessage) {
//         throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create message");
//     }

//     // Calculate unread count for receiver and include in the event
//     let unreadCountForReceiver = 0;
//     if (receiver) {
//         unreadCountForReceiver = await Message.countDocuments({
//             conversationId: conversation._id,
//             sender: { $ne: receiver },
//             isRead: false,
//         });
//     }

//     // Emit new message with unread count data
//     emitToConversation(messageData.conversationId, "message:new", {
//         message: populatedMessage,
//         unreadCount: unreadCountForReceiver,
//         receiverId: receiver?.toString(),
//     });

//     console.log(`✅ Message sent and emitted to conversation ${messageData.conversationId}`);

//     return populatedMessage;
// };

// const getConversationMessages = async (conversationId: string, userId: string, page: number = 1, limit: number = 50) => {
//     // Verify user has access to this conversation
//     const conversation = await Conversation.findOne({
//         _id: conversationId,
//         participants: userId,
//         isActive: true,
//     });

//     if (!conversation) {
//         throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
//     }

//     const skip = (page - 1) * limit;

//     const messages = await Message.find({ conversationId }).populate("sender", "name profileImg email phone").populate("propertyId", "propertyNumber price title location").sort({ createdAt: -1 }).skip(skip).limit(limit);

//     // Return in chronological order (oldest first)
//     return messages.reverse();
// };

// const getMessageById = async (messageId: string, userId: string) => {
//     const message = await Message.findById(messageId).populate("sender", "name profileImg email phone").populate("propertyId", "propertyNumber price title location");

//     if (!message) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
//     }

//     // Verify user has access to this message's conversation
//     const conversation = await Conversation.findOne({
//         _id: message.conversationId,
//         participants: userId,
//         isActive: true,
//     });

//     if (!conversation) {
//         throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this message");
//     }

//     return message;
// };

// const markMessageAsRead = async (messageId: string, userId: string) => {
//     const message = await Message.findById(messageId);

//     if (!message) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
//     }

//     // Verify user has access to this message's conversation
//     const conversation = await Conversation.findOne({
//         _id: message.conversationId,
//         participants: userId,
//         isActive: true,
//     });

//     if (!conversation) {
//         throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this message");
//     }

//     // Update message read status
//     const updatedMessage = await Message.findByIdAndUpdate(
//         messageId,
//         {
//             $addToSet: { readBy: userId },
//         },
//         { new: true }
//     ).populate("sender", "name profileImg email");

//     // Emit read receipt to conversation participants
//     const io = getIO();
//     io.to(message.conversationId.toString()).emit("message:read", {
//         messageId,
//         conversationId: message.conversationId,
//         readBy: userId,
//         readAt: new Date(),
//     });

//     return {
//         success: true,
//         message: "Message marked as read",
//         data: updatedMessage,
//     };
// };

// const rejectOffer = async (messageId: string, conversationId: string, userId: string) => {
//     // Verify the message exists and is an offer
//     const message = await Message.findById(messageId);
//     if (!message) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
//     }

//     if (message.type !== "offer") {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Can only reject offer messages");
//     }

//     // Verify user has access to this conversation
//     const conversation = await Conversation.findOne({
//         _id: conversationId,
//         participants: userId,
//         isActive: true,
//     });

//     if (!conversation) {
//         throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
//     }

//     // UPDATE the existing message to rejected
//     const updatedMessage = await Message.findByIdAndUpdate(
//         messageId,
//         {
//             type: "rejected",
//         },
//         { new: true }
//     )
//         .populate("sender", "name profileImg email phone")
//         .populate("propertyId", "propertyNumber price title images location");

//     if (!updatedMessage) {
//         throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to reject offer");
//     }

//     // Update conversation's last message
//     await Conversation.findByIdAndUpdate(conversationId, {
//         lastMessage: updatedMessage._id,
//         updatedAt: new Date(),
//     });

//     // Emit the updated message as a new message (using existing event)
//     emitToConversation(conversationId, "message:new", updatedMessage);
//     // emitToConversation(conversationId, "offer:rejected", updatedMessage);
//     emitToConversation(conversationId, "offer:rejected", {
//         messageId: updatedMessage._id,
//         conversationId,
//     });

//     console.log(`✅ Offer rejected by user ${userId}`);

//     return updatedMessage;
// };

// const acceptOffer = async (messageId: string, conversationId: string, userId: string) => {
//     // Verify the message exists and is an offer
//     const message = await Message.findById(messageId);
//     if (!message) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
//     }

//     if (message.type !== "offer") {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Can only accept offers");
//     }

//     // Verify user has access to this conversation
//     const conversation = await Conversation.findOne({
//         _id: conversationId,
//         participants: userId,
//         isActive: true,
//     });

//     if (!conversation) {
//         throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
//     }

//     // UPDATE the existing message to accepted
//     const updatedMessage = await Message.findByIdAndUpdate(
//         messageId,
//         {
//             type: "accepted",
//         },
//         { new: true }
//     )
//         .populate("sender", "name profileImg email phone")
//         .populate("propertyId", "propertyNumber price title images location");

//     if (!updatedMessage) {
//         throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to accept offer");
//     }

//     // Update conversation's last message
//     await Conversation.findByIdAndUpdate(conversationId, {
//         lastMessage: updatedMessage._id,
//         updatedAt: new Date(),
//     });

//     // Emit accepted offer event
//     emitToConversation(conversationId, "message:new", updatedMessage);
//     emitToConversation(conversationId, "offer:rejected", {
//         messageId: updatedMessage._id,
//         conversationId,
//     });

//     console.log(`✅ Offer accepted by user ${userId}`);

//     return updatedMessage;
// };

// export const messageServices = {
//     createConversation,
//     getUserConversations,
//     getConversationById,
//     createMessage,
//     getConversationMessages,
//     getMessageById,
//     markMessageAsRead,
//     rejectOffer,
//     acceptOffer,
// };

import httpStatus from "http-status";
import { ICreateConversationDto, ICreateMessageDto } from "./messages.interface";
import { Conversation, Message } from "./messages.model";
import ApiError from "../../../errors/ApiError";
import { getIO } from "../../../socket/socket";
import { emitToConversation, emitToUser } from "../../../socket/socketHandlers";
import { UserModel } from "../auth/auth.model";

const createConversation = async (conversationData: ICreateConversationDto) => {
    const existingConversation = await Conversation.findOne({
        participants: { $all: conversationData.participants },
        isActive: true,
    });

    if (existingConversation) {
        return await Conversation.findById(existingConversation._id).populate("participants", "name profileImg email phone").populate("lastMessage");
    }

    const conversation = await Conversation.create(conversationData);

    const io = getIO();
    const populatedConversation = await Conversation.findById(conversation._id).populate("participants", "name profileImg email phone");

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
        .populate("participants", "name profileImg email phone")
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
        .populate("participants", "name profileImg email phone")
        .populate({
            path: "lastMessage",
            populate: {
                path: "propertyId",
                select: "title images location price propertyNumber _id",
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

    const receiver = conversation.participants.find((p) => p.toString() !== messageData.sender.toString());
    let bookingFee = 30;
    if (receiver) {
        const receiverData = await UserModel.findById(receiver)
            .select("_id name email role phone profileImg subscriptions freeTireSub freeTireData")
            .populate({
                path: "freeTireSub",
                select: "_id name price duration",
            })
            .populate({
                path: "subscriptions.subscription",
                select: "_id bookingFee commission listingLimit freeBookings bookingLimit",
            });
        console.log("🎯 Receiver with subscriptions and free trial populated:", receiverData);
    }

    const message = await Message.create({ ...messageData, bookingFee });

    await Conversation.findByIdAndUpdate(messageData.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate("sender", "name profileImg email phone").populate("propertyId", "propertyNumber price title location");

    if (!populatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create message");
    }

    // NEW: Calculate unread count for receiver
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

    const messages = await Message.find({ conversationId }).populate("sender", "name profileImg email phone").populate("propertyId", "propertyNumber price title location").sort({ createdAt: -1 }).skip(skip).limit(limit);

    return messages.reverse();
};

const getMessageById = async (messageId: string, userId: string) => {
    const message = await Message.findById(messageId).populate("sender", "name profileImg email phone").populate("propertyId", "propertyNumber price title location");

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
    const updatedMessage = await Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true }).populate("sender", "name profileImg email");

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

    if (message.type !== "offer") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only reject offer messages");
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
        .populate("sender", "name profileImg email phone")
        .populate("propertyId", "propertyNumber price title images location");

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
        .populate("sender", "name profileImg email phone")
        .populate("propertyId", "propertyNumber price title images location");

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
        .populate("participants", "name profileImg email phone")
        .populate({
            path: "lastMessage",
            populate: {
                path: "propertyId",
                select: "title images location price propertyNumber _id",
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

export const messageServices = {
    createConversation,
    getUserConversations,
    getConversationById,
    createMessage,
    getConversationMessages,
    getMessageById,
    markMessageAsRead,
    rejectOffer,
    acceptOffer,
    // Mark all messages read in conversion
    markConversationAsRead,
    getTotalUnreadCount,
};
