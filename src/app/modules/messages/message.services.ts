import httpStatus from "http-status";
import { ICreateConversationDto, ICreateMessageDto } from "./messages.interface";
import { Conversation, Message } from "./messages.model";
import ApiError from "../../../errors/ApiError";
import { getIO } from "../../../socket/socket";
import { emitToConversation } from "../../../socket/socketHandlers";

const createConversation = async (conversationData: ICreateConversationDto) => {
    // Check if conversation already exists between these participants
    const existingConversation = await Conversation.findOne({
        participants: { $all: conversationData.participants },
        isActive: true,
    });

    if (existingConversation) {
        // Return existing conversation instead of throwing error
        return await Conversation.findById(existingConversation._id).populate("participants", "name profileImg email").populate("lastMessage");
    }

    const conversation = await Conversation.create(conversationData);

    // Emit conversation created event to all participants
    const io = getIO();
    const populatedConversation = await Conversation.findById(conversation._id).populate("participants", "name profileImg email");

    // Emit to all participants
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
        .populate("participants", "name profileImg email")
        .populate("lastMessage")
        .sort({ updatedAt: -1 });

    return conversations;
};

const getConversationById = async (conversationId: string, userId: string) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    })
        .populate("participants", "name profileImg email")
        .populate("lastMessage");

    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    return conversation;
};

const createMessage = async (messageData: ICreateMessageDto) => {
    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findOne({
        _id: messageData.conversationId,
        participants: messageData.sender,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Cannot send message to this conversation");
    }

    const message = await Message.create(messageData);

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(messageData.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
    });

    // Populate the message with sender info
    const populatedMessage = await Message.findById(message._id).populate("sender", "name profileImg email");

    if (!populatedMessage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create message");
    }

    // Emit new message to ALL participants in the conversation
    emitToConversation(messageData.conversationId, "message:new", populatedMessage);

    console.log(`✅ Message sent and emitted to conversation ${messageData.conversationId}`);

    return populatedMessage;
};

const getConversationMessages = async (conversationId: string, userId: string, page: number = 1, limit: number = 50) => {
    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this conversation");
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId }).populate("sender", "name profileImg email").sort({ createdAt: -1 }).skip(skip).limit(limit);

    // Return in chronological order (oldest first)
    return messages.reverse();
};

const getMessageById = async (messageId: string, userId: string) => {
    const message = await Message.findById(messageId).populate("sender", "name profileImg email");

    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    // Verify user has access to this message's conversation
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

    // Verify user has access to this message's conversation
    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        participants: userId,
        isActive: true,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied to this message");
    }

    // Update message read status
    const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
            $addToSet: { readBy: userId },
        },
        { new: true }
    ).populate("sender", "name profileImg email");

    // Emit read receipt to conversation participants
    const io = getIO();
    io.to(message.conversationId.toString()).emit("message:read", {
        messageId,
        conversationId: message.conversationId,
        readBy: userId,
        readAt: new Date(),
    });

    return {
        success: true,
        message: "Message marked as read",
        data: updatedMessage,
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
};
