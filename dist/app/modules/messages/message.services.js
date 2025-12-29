"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const messages_model_1 = require("./messages.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const socket_1 = require("../../../socket/socket");
const socketHandlers_1 = require("../../../socket/socketHandlers");
const auth_model_1 = require("../auth/auth.model");
const contentFilter_1 = require("../../../utils/contentFilter");
const createConversation = (conversationData) => __awaiter(void 0, void 0, void 0, function* () {
    const existingConversation = yield messages_model_1.Conversation.findOne({
        participants: { $all: conversationData.participants },
        isActive: true,
    });
    if (existingConversation) {
        if (existingConversation.isReplyAllowed) {
            messages_model_1.Conversation.findByIdAndUpdate(existingConversation._id, {
                isReplyAllowed: conversationData.isReplyAllowed,
            });
        }
        yield messages_model_1.Conversation.findByIdAndUpdate(existingConversation._id, {
            updatedAt: new Date(),
        });
        return yield messages_model_1.Conversation.findById(existingConversation._id).populate("participants", "name profileImg email phone role").populate("lastMessage");
    }
    const conversation = yield messages_model_1.Conversation.create(conversationData);
    const io = (0, socket_1.getIO)();
    const populatedConversation = yield messages_model_1.Conversation.findById(conversation._id).populate("participants", "name profileImg email phone role");
    conversationData.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("conversation:new", populatedConversation);
    });
    return populatedConversation;
});
// const getUserConversations = async (userId: string) => {
//     const conversations = await Conversation.find({
//         participants: userId,
//         isActive: true,
//     })
//         .populate("participants", "name profileImg email phone role isVerifiedByAdmin")
//         .populate({
//             path: "lastMessage",
//             populate: {
//                 path: "propertyId",
//                 select: "title images location price propertyNumber _id createdBy",
//             },
//         })
//         .sort({ updatedAt: -1 });
//     // NEW: Calculate unread count for each conversation
//     const conversationsWithUnread = await Promise.all(
//         conversations.map(async (conversation) => {
//             const unreadCount = await Message.countDocuments({
//                 conversationId: conversation._id,
//                 sender: { $ne: userId }, // Messages from other users
//                 isRead: false,
//             });
//             return {
//                 ...conversation.toObject(),
//                 unreadCount, // Add calculated unread count
//             };
//         })
//     );
//     return conversationsWithUnread;
// };
const getUserConversations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversations = yield messages_model_1.Conversation.find({
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
    const conversationsWithUnread = yield Promise.all(conversations.map((conversation) => __awaiter(void 0, void 0, void 0, function* () {
        const unreadCount = yield messages_model_1.Message.countDocuments({
            conversationId: conversation._id,
            sender: { $ne: userId },
            isRead: false,
        });
        return Object.assign(Object.assign({}, conversation.toObject()), { unreadCount });
    })));
    // NEW: Separate bot conversation and sort the rest
    const botConversation = conversationsWithUnread.find((conv) => conv.bot === true);
    const otherConversations = conversationsWithUnread.filter((conv) => conv.bot !== true);
    // If bot conversation exists, put it first, then other conversations
    const sortedConversations = botConversation ? [botConversation, ...otherConversations] : otherConversations;
    return sortedConversations;
});
const getConversationById = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield messages_model_1.Conversation.findOne({
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
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Conversation not found");
    }
    return conversation;
});
const createMessage = (messageData) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: messageData.conversationId,
        participants: messageData.sender,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Cannot send message to this conversation");
    }
    const sender = yield auth_model_1.UserModel.findById(messageData.sender).select("role").lean();
    if ((sender === null || sender === void 0 ? void 0 : sender.role) === "HOST" || (sender === null || sender === void 0 ? void 0 : sender.role) === "ADMIN") {
        yield messages_model_1.Conversation.findByIdAndUpdate(messageData.conversationId, {
            isReplyAllowed: true,
        });
    }
    let receiver;
    if (messageData.type === "offer") {
        receiver = conversation.participants.find((p) => p.toString() !== messageData.sender.toString());
    }
    else if (messageData.type === "request") {
        receiver = conversation.participants.find((p) => p.toString() === messageData.sender.toString());
    }
    let bookingFee = 30;
    if (receiver) {
        const receiverData = yield auth_model_1.UserModel.findById(receiver)
            .select("_id name email role phone profileImg subscriptions freeTireSub freeTireData currentSubscription")
            .populate({
            path: "freeTireSub",
            select: "_id name price duration",
        })
            .populate({
            path: "currentSubscription",
            select: "_id bookingFee commission listingLimit freeBookings bookingLimit",
        })
            .lean();
        const agreedFeeNum = Number((messageData === null || messageData === void 0 ? void 0 : messageData.agreedFee) || 0);
        if (receiverData === null || receiverData === void 0 ? void 0 : receiverData.currentSubscription) {
            const sub = receiverData.currentSubscription;
            if (sub.bookingLimit && sub.bookingLimit > 0) {
                bookingFee = 0;
            }
            else {
                bookingFee = sub.bookingFee !== undefined && sub.bookingFee !== null ? (agreedFeeNum * sub.bookingFee) / 100 : agreedFeeNum * 0.1;
                if (messageData.checkInDate && messageData.checkOutDate) {
                    const checkIn = new Date(messageData.checkInDate);
                    const checkOut = new Date(messageData.checkOutDate);
                    // Calculate days difference
                    const timeDiff = checkOut.getTime() - checkIn.getTime();
                    const numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                    // Minimum $10 per day
                    const minimumFee = numberOfDays * 10;
                    // Ensure booking fee is at least minimum
                    if (bookingFee < minimumFee) {
                        bookingFee = minimumFee;
                    }
                }
            }
        }
        else {
            bookingFee = agreedFeeNum * 0.1;
            if (messageData.checkInDate && messageData.checkOutDate) {
                const checkIn = new Date(messageData.checkInDate);
                const checkOut = new Date(messageData.checkOutDate);
                const timeDiff = checkOut.getTime() - checkIn.getTime();
                const numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                const minimumFee = numberOfDays * 10;
                if (bookingFee < minimumFee) {
                    bookingFee = minimumFee;
                }
            }
        }
        bookingFee = Number(bookingFee.toFixed(2));
    }
    let finalMessageData = messageData;
    // Only sanitize if skip is not true
    if (!messageData.skip) {
        const sanitizedText = (0, contentFilter_1.sanitizeMessageText)(messageData.text || "");
        finalMessageData = Object.assign(Object.assign({}, messageData), { text: sanitizedText });
    }
    const message = yield messages_model_1.Message.create(Object.assign(Object.assign({}, finalMessageData), { bookingFee }));
    yield messages_model_1.Conversation.findByIdAndUpdate(messageData.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
    });
    const populatedMessage = yield messages_model_1.Message.findById(message._id)
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
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create message");
    }
    let unreadCountForReceiver = 0;
    if (receiver) {
        unreadCountForReceiver = yield messages_model_1.Message.countDocuments({
            conversationId: conversation._id,
            sender: { $ne: receiver },
            isRead: false,
        });
    }
    // NEW: Emit with unread count data
    (0, socketHandlers_1.emitToConversation)(messageData.conversationId, "message:new", {
        message: populatedMessage,
        unreadCount: unreadCountForReceiver,
        receiverId: receiver === null || receiver === void 0 ? void 0 : receiver.toString(),
    });
    console.log(`✅ Message sent and emitted to conversation ${messageData.conversationId}`);
    return populatedMessage;
});
const getConversationMessages = (conversationId_1, userId_1, ...args_1) => __awaiter(void 0, [conversationId_1, userId_1, ...args_1], void 0, function* (conversationId, userId, page = 1, limit = 50) {
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this conversation");
    }
    const skip = (page - 1) * limit;
    const messages = yield messages_model_1.Message.find({ conversationId })
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
});
const getMessageById = (messageId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // const message = await Message.findById(messageId).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location createdBy");
    const message = yield messages_model_1.Message.findById(messageId)
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
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: message.conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this message");
    }
    return message;
});
const markMessageAsRead = (messageId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: message.conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this message");
    }
    // CHANGED: Use isRead instead of readBy
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true }).populate("sender", "name profileImg email role");
    // NEW: Calculate updated unread count
    const unreadCount = yield messages_model_1.Message.countDocuments({
        conversationId: conversation._id,
        sender: { $ne: userId },
        isRead: false,
    });
    // NEW: Emit with unread count
    const io = (0, socket_1.getIO)();
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
});
const rejectOffer = (messageId, conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    if (message.type !== "offer" && message.type !== "request") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Can only reject offer or request messages");
    }
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this conversation");
    }
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        type: "rejected",
    }, { new: true })
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
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to reject offer");
    }
    yield messages_model_1.Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });
    (0, socketHandlers_1.emitToConversation)(conversationId, "message:new", updatedMessage);
    (0, socketHandlers_1.emitToConversation)(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });
    console.log(`✅ Offer rejected by user ${userId}`);
    return updatedMessage;
});
const convertRequestToOffer = (messageId, conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    if (message.type !== "request") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Can only convert request messages");
    }
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this conversation");
    }
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        type: "offer",
    }, { new: true })
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
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to convert request to offer");
    }
    yield messages_model_1.Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });
    (0, socketHandlers_1.emitToConversation)(conversationId, "message:new", updatedMessage);
    (0, socketHandlers_1.emitToConversation)(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });
    console.log(`✅ Request converted to offer by user ${userId}`);
    return updatedMessage;
});
const convertMakeOfferToRequest = (messageId, conversationId, userId, requestData) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    if (message.type !== "makeoffer") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Can only convert makeoffer messages");
    }
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this conversation");
    }
    let bookingFee = 0;
    const receiver = userId;
    const receiverData = yield auth_model_1.UserModel.findById(receiver).select("currentSubscription").populate("currentSubscription", "bookingFee bookingLimit").lean();
    const agreedFeeNum = Number(requestData.agreedFee);
    if (receiverData === null || receiverData === void 0 ? void 0 : receiverData.currentSubscription) {
        const sub = receiverData.currentSubscription;
        if (sub.bookingLimit && sub.bookingLimit > 0) {
            bookingFee = 0;
        }
        else {
            bookingFee = sub.bookingFee !== undefined && sub.bookingFee !== null ? (agreedFeeNum * sub.bookingFee) / 100 : agreedFeeNum * 0.1;
        }
    }
    else {
        bookingFee = agreedFeeNum * 0.1;
    }
    bookingFee = Number(bookingFee.toFixed(2));
    // Update the message to request type with all data
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        type: "request",
        checkInDate: requestData.checkInDate,
        checkOutDate: requestData.checkOutDate,
        agreedFee: requestData.agreedFee,
        guestNo: requestData.guestNo,
        bookingFee: bookingFee,
        bookingFeePaid: false,
    }, { new: true })
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
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to convert makeoffer to request");
    }
    yield messages_model_1.Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });
    (0, socketHandlers_1.emitToConversation)(conversationId, "message:new", updatedMessage);
    (0, socketHandlers_1.emitToConversation)(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });
    console.log(`✅ Makeoffer converted to request by user ${userId}`);
    return updatedMessage;
});
const acceptOffer = (messageId, conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    if (message.type !== "offer") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Can only accept offers");
    }
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this conversation");
    }
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        hostFeePaid: true,
        type: "accepted",
    }, { new: true })
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
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to accept offer");
    }
    yield messages_model_1.Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });
    (0, socketHandlers_1.emitToConversation)(conversationId, "message:new", updatedMessage);
    (0, socketHandlers_1.emitToConversation)(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });
    console.log(`✅ Offer accepted by user ${userId}`);
    return updatedMessage;
});
/**
 * Update booking fee paid status to true
 */
const updateBookingFeePaid = (messageId, conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this conversation");
    }
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        bookingFeePaid: true,
    }, { new: true })
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
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update booking fee status");
    }
    yield messages_model_1.Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });
    (0, socketHandlers_1.emitToConversation)(conversationId, "message:new", updatedMessage);
    (0, socketHandlers_1.emitToConversation)(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });
    return updatedMessage;
});
const reviewDone = (messageId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        reviewed: true,
    }, { new: true })
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
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update booking fee status");
    }
    yield messages_model_1.Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessage: updatedMessage._id,
        updatedAt: new Date(),
    });
    (0, socketHandlers_1.emitToConversation)(message.conversationId.toString(), "message:new", updatedMessage);
    (0, socketHandlers_1.emitToConversation)(message.conversationId.toString(), "offer:rejected", {
        messageId: updatedMessage._id.toString(),
        conversationId: message.conversationId.toString(),
    });
    return updatedMessage;
});
const markConversationAsRead = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this conversation");
    }
    // Mark all messages as read
    yield messages_model_1.Message.updateMany({
        conversationId: conversationId,
        isRead: false,
        sender: { $ne: userId },
    }, {
        isRead: true,
    });
    // Get the updated conversation with recalculated unread count
    const updatedConversation = yield messages_model_1.Conversation.findById(conversationId)
        .populate("participants", "name profileImg email phone role")
        .populate({
        path: "lastMessage",
        populate: {
            path: "propertyId",
            select: "title images location price propertyNumber _id createdBy",
        },
    });
    if (!updatedConversation) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Conversation not found");
    }
    // Calculate the new unread count (should be 0)
    const unreadCount = yield messages_model_1.Message.countDocuments({
        conversationId: conversationId,
        sender: { $ne: userId },
        isRead: false,
    });
    // Emit conversation read event with updated data
    const io = (0, socket_1.getIO)();
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
});
const getTotalUnreadCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const totalUnreadCount = yield messages_model_1.Message.countDocuments({
        // Messages where user is not the sender AND message is not read
        sender: { $ne: userId },
        isRead: false,
        // Make sure the message belongs to a conversation where user is a participant
        conversationId: {
            $in: yield messages_model_1.Conversation.find({
                participants: userId,
                isActive: true,
            }).distinct("_id"),
        },
    });
    return {
        totalUnreadCount,
    };
});
// This is for admin
const getConversationsByUserId = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 20) {
    // Validate if user exists
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const skip = (page - 1) * limit;
    const conversations = yield messages_model_1.Conversation.find({
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
    const totalConversations = yield messages_model_1.Conversation.countDocuments({
        participants: userId,
        isActive: true,
    });
    // Calculate unread counts for each conversation
    const conversationsWithUnread = yield Promise.all(conversations.map((conversation) => __awaiter(void 0, void 0, void 0, function* () {
        const unreadCount = yield messages_model_1.Message.countDocuments({
            conversationId: conversation._id,
            sender: { $ne: userId },
            isRead: false,
        });
        return Object.assign(Object.assign({}, conversation.toObject()), { unreadCount });
    })));
    return {
        conversations: conversationsWithUnread,
        meta: {
            page,
            limit,
            total: totalConversations,
        },
    };
});
const getAllConversationMessages = (conversationId_1, ...args_1) => __awaiter(void 0, [conversationId_1, ...args_1], void 0, function* (conversationId, page = 1, limit = 100) {
    // Verify conversation exists (admin can access any conversation)
    const conversation = yield messages_model_1.Conversation.findById(conversationId);
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Conversation not found");
    }
    const skip = (page - 1) * limit;
    // const messages = await Message.find({ conversationId }).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location createdBy images").sort({ createdAt: -1 }).skip(skip).limit(limit);
    const messages = yield messages_model_1.Message.find({ conversationId })
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
    const totalMessages = yield messages_model_1.Message.countDocuments({ conversationId });
    return {
        messages: messages.reverse(),
        meta: {
            page,
            limit,
            total: totalMessages,
        },
        conversation: yield messages_model_1.Conversation.findById(conversationId).populate("participants", "name profileImg email phone role isVerifiedByAdmin"),
    };
});
const searchUserConversations = (searchTerm_1, ...args_1) => __awaiter(void 0, [searchTerm_1, ...args_1], void 0, function* (searchTerm, page = 1, limit = 20) {
    if (!searchTerm || searchTerm.trim().length < 2) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Search term must be at least 2 characters long");
    }
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(searchTerm, "i");
    // Search users by name, email, phone
    const users = yield auth_model_1.UserModel.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
    })
        .select("_id name email phone profileImg role")
        .skip(skip)
        .limit(limit);
    const totalUsers = yield auth_model_1.UserModel.countDocuments({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
    });
    // Get conversations for each user
    const usersWithConversations = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
        const conversations = yield messages_model_1.Conversation.find({
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
    })));
    return {
        results: usersWithConversations,
        meta: {
            page,
            limit,
            total: totalUsers,
        },
    };
});
const editOffer = (messageId, conversationId, userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message not found");
    }
    // Only allow editing offer or request messages
    if (message.type !== "offer" && message.type !== "request") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Can only edit offer or request messages");
    }
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Access denied to this conversation");
    }
    const updateFields = {};
    if (updateData.agreedFee !== undefined) {
        updateFields.agreedFee = updateData.agreedFee;
        let guest;
        if (message.type === "offer") {
            guest = conversation.participants.find((p) => p.toString() !== message.sender.toString());
        }
        else if (message.type === "request") {
            guest = message.sender;
        }
        if (guest) {
            const guestData = yield auth_model_1.UserModel.findById(guest).populate("currentSubscription", "bookingFee bookingLimit").lean();
            const agreedFeeNum = Number(updateData.agreedFee);
            let bookingFee = 0;
            if (guestData === null || guestData === void 0 ? void 0 : guestData.currentSubscription) {
                const sub = guestData.currentSubscription;
                if (sub.bookingLimit && sub.bookingLimit > 0) {
                    bookingFee = 0;
                }
                else {
                    const feePercentage = sub.bookingFee !== undefined && sub.bookingFee !== null ? sub.bookingFee : 10;
                    bookingFee = (agreedFeeNum * feePercentage) / 100;
                    // NEW: Add minimum fee calculation based on check-in/out dates
                    if (message.checkInDate && message.checkOutDate) {
                        const checkIn = new Date(message.checkInDate);
                        const checkOut = new Date(message.checkOutDate);
                        // Calculate days difference
                        const timeDiff = checkOut.getTime() - checkIn.getTime();
                        const numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                        // Minimum $10 per day
                        const minimumFee = numberOfDays * 10;
                        // Ensure booking fee is at least minimum
                        if (bookingFee < minimumFee) {
                            bookingFee = minimumFee;
                        }
                    }
                }
            }
            else {
                bookingFee = agreedFeeNum * 0.1;
                if (message.checkInDate && message.checkOutDate) {
                    const checkIn = new Date(message.checkInDate);
                    const checkOut = new Date(message.checkOutDate);
                    const timeDiff = checkOut.getTime() - checkIn.getTime();
                    const numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                    const minimumFee = numberOfDays * 10;
                    if (bookingFee < minimumFee) {
                        bookingFee = minimumFee;
                    }
                }
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
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, updateFields, { new: true })
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
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update offer");
    }
    // Update conversation's last message timestamp
    yield messages_model_1.Conversation.findByIdAndUpdate(conversationId, {
        updatedAt: new Date(),
    });
    // Emit the updated message to the conversation
    (0, socketHandlers_1.emitToConversation)(conversationId, "message:new", updatedMessage);
    (0, socketHandlers_1.emitToConversation)(conversationId, "offer:rejected", {
        messageId: updatedMessage._id,
        conversationId,
    });
    console.log(`✅ Offer updated by user ${userId}`);
    return updatedMessage;
});
const filterConversationsByUpdatedAt = (filter_1, ...args_1) => __awaiter(void 0, [filter_1, ...args_1], void 0, function* (filter, page = 1, limit = 20) {
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
    const query = Object.assign({ isActive: true }, dateFilter);
    // Get conversations with pagination
    const conversations = yield messages_model_1.Conversation.find(query)
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
    const totalConversations = yield messages_model_1.Conversation.countDocuments(query);
    return {
        conversations: conversations,
        meta: {
            page,
            limit,
            total: totalConversations,
        },
    };
});
exports.messageServices = {
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
