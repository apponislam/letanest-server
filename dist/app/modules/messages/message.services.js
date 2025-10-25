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
const getUserConversations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversations = yield messages_model_1.Conversation.find({
        participants: userId,
        isActive: true,
    })
        .populate("participants", "name profileImg email phone role")
        .populate({
        path: "lastMessage",
        populate: {
            path: "propertyId",
            select: "title images location price propertyNumber _id",
        },
    })
        .sort({ updatedAt: -1 });
    // NEW: Calculate unread count for each conversation
    const conversationsWithUnread = yield Promise.all(conversations.map((conversation) => __awaiter(void 0, void 0, void 0, function* () {
        const unreadCount = yield messages_model_1.Message.countDocuments({
            conversationId: conversation._id,
            sender: { $ne: userId }, // Messages from other users
            isRead: false,
        });
        return Object.assign(Object.assign({}, conversation.toObject()), { unreadCount });
    })));
    return conversationsWithUnread;
});
const getConversationById = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield messages_model_1.Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    })
        .populate("participants", "name profileImg email phone role")
        .populate({
        path: "lastMessage",
        populate: {
            path: "propertyId",
            select: "title images location price propertyNumber _id",
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
    const receiver = conversation.participants.find((p) => p.toString() !== messageData.sender.toString());
    let bookingFee = 30;
    if (receiver) {
        const receiverData = yield auth_model_1.UserModel.findById(receiver)
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
    console.log(messageData);
    let finalMessageData = messageData;
    // Only sanitize if skip is not true
    if (!messageData.skip) {
        const sanitizedText = (0, contentFilter_1.sanitizeMessageText)(messageData.text || "");
        finalMessageData = Object.assign(Object.assign({}, messageData), { text: sanitizedText });
    }
    const message = yield messages_model_1.Message.create(Object.assign(Object.assign({}, finalMessageData), { bookingFee }));
    // const message = await Message.create({ ...messageData, bookingFee });
    yield messages_model_1.Conversation.findByIdAndUpdate(messageData.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
    });
    const populatedMessage = yield messages_model_1.Message.findById(message._id).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location");
    if (!populatedMessage) {
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create message");
    }
    // NEW: Calculate unread count for receiver
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
    const messages = yield messages_model_1.Message.find({ conversationId }).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location").sort({ createdAt: -1 }).skip(skip).limit(limit);
    return messages.reverse();
});
const getMessageById = (messageId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId).populate("sender", "name profileImg email phone role").populate("propertyId", "propertyNumber price title location");
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
    if (message.type !== "offer") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Can only reject offer messages");
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
        .populate("propertyId", "propertyNumber price title images location");
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
        type: "accepted",
    }, { new: true })
        .populate("sender", "name profileImg email phone role")
        .populate("propertyId", "propertyNumber price title images location");
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
            select: "title images location price propertyNumber _id",
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
exports.messageServices = {
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
