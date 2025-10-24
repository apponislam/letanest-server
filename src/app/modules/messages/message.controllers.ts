import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import { messageServices } from "./message.services";
import sendResponse from "../../../utils/sendResponse.";
import ApiError from "../../../errors/ApiError";

const createConversation = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const conversation = await messageServices.createConversation({
        ...req.body,
        participants: [...req.body.participants, userId.toString()],
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Conversation created successfully",
        data: conversation,
    });
});

const getUserConversations = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const conversations = await messageServices.getUserConversations(userId.toString());

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Conversations fetched successfully",
        data: conversations,
    });
});

const getConversationById = catchAsync(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const conversation = await messageServices.getConversationById(conversationId, userId.toString());

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Conversation fetched successfully",
        data: conversation,
    });
});

const sendMessage = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const message = await messageServices.createMessage({
        ...req.body,
        sender: userId.toString(),
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Message sent successfully",
        data: message,
    });
});

const sendMessageAuto = catchAsync(async (req, res) => {
    const message = await messageServices.createMessage({
        ...req.body,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Message sent successfully",
        data: message,
    });
});

const getConversationMessages = catchAsync(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const messages = await messageServices.getConversationMessages(conversationId, userId.toString(), Number(page), Number(limit));

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Messages fetched successfully",
        data: messages,
    });
});

const getMessageById = catchAsync(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await messageServices.getMessageById(messageId, userId.toString());

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Message fetched successfully",
        data: message,
    });
});

const markAsRead = catchAsync(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id;
    const result = await messageServices.markMessageAsRead(messageId, userId.toString());

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Message marked as read",
        data: result,
    });
});

const rejectOffer = catchAsync(async (req, res) => {
    const { messageId } = req.params;
    const { conversationId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!conversationId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Conversation ID is required");
    }

    const result = await messageServices.rejectOffer(messageId, conversationId, userId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Offer rejected successfully",
        data: result,
    });
});

const acceptOffer = catchAsync(async (req, res) => {
    const { messageId } = req.params;
    const { conversationId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!conversationId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Conversation ID is required");
    }

    const result = await messageServices.acceptOffer(messageId, conversationId, userId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Offer accepted successfully",
        data: result,
    });
});

const markConversationAsRead = catchAsync(async (req, res) => {
    const { conversationId } = req.params;
    console.log(conversationId);
    const userId = req.user._id;
    const result = await messageServices.markConversationAsRead(conversationId, userId.toString());

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Conversation marked as read",
        data: result, // Use the result directly
    });
});

const getTotalUnreadCount = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const result = await messageServices.getTotalUnreadCount(userId.toString());

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Total unread count fetched successfully",
        data: result,
    });
});

export const messageControllers = {
    createConversation,
    getUserConversations,
    getConversationById,
    sendMessage,
    sendMessageAuto,
    getConversationMessages,
    getMessageById,
    markAsRead,
    rejectOffer,
    acceptOffer,
    //mark all read
    markConversationAsRead,
    getTotalUnreadCount,
};
