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
exports.messageControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const message_services_1 = require("./message.services");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createConversation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const conversation = yield message_services_1.messageServices.createConversation(Object.assign(Object.assign({}, req.body), { participants: [...req.body.participants, userId.toString()] }));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Conversation created successfully",
        data: conversation,
    });
}));
const getUserConversations = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const conversations = yield message_services_1.messageServices.getUserConversations(userId.toString());
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Conversations fetched successfully",
        data: conversations,
    });
}));
const getConversationById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const conversation = yield message_services_1.messageServices.getConversationById(conversationId, userId.toString());
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Conversation fetched successfully",
        data: conversation,
    });
}));
const sendMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const message = yield message_services_1.messageServices.createMessage(Object.assign(Object.assign({}, req.body), { sender: userId.toString() }));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Message sent successfully",
        data: message,
    });
}));
const sendMessageAuto = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield message_services_1.messageServices.createMessage(Object.assign({}, req.body));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Message sent successfully",
        data: message,
    });
}));
const getConversationMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const messages = yield message_services_1.messageServices.getConversationMessages(conversationId, userId.toString(), Number(page), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Messages fetched successfully",
        data: messages,
    });
}));
const getMessageById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = yield message_services_1.messageServices.getMessageById(messageId, userId.toString());
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Message fetched successfully",
        data: message,
    });
}));
const markAsRead = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const userId = req.user._id;
    const result = yield message_services_1.messageServices.markMessageAsRead(messageId, userId.toString());
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Message marked as read",
        data: result,
    });
}));
const rejectOffer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { messageId } = req.params;
    const { conversationId } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    if (!conversationId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Conversation ID is required");
    }
    const result = yield message_services_1.messageServices.rejectOffer(messageId, conversationId, userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Offer rejected successfully",
        data: result,
    });
}));
const convertRequestToOfferController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { messageId } = req.params;
    const { conversationId } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    if (!conversationId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Conversation ID is required");
    }
    const result = yield message_services_1.messageServices.convertRequestToOffer(messageId, conversationId, userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Request converted to offer successfully",
        data: result,
    });
}));
const convertMakeOfferToRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { messageId } = req.params;
    const { conversationId, checkInDate, checkOutDate, agreedFee, guestNo } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    if (!conversationId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Conversation ID is required");
    }
    const result = yield message_services_1.messageServices.convertMakeOfferToRequest(messageId, conversationId, userId, { checkInDate, checkOutDate, agreedFee, guestNo });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Makeoffer converted to request successfully",
        data: result,
    });
}));
const acceptOffer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { messageId } = req.params;
    const { conversationId } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    if (!conversationId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Conversation ID is required");
    }
    const result = yield message_services_1.messageServices.acceptOffer(messageId, conversationId, userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Offer accepted successfully",
        data: result,
    });
}));
const markConversationAsRead = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    console.log(conversationId);
    const userId = req.user._id;
    const result = yield message_services_1.messageServices.markConversationAsRead(conversationId, userId.toString());
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Conversation marked as read",
        data: result, // Use the result directly
    });
}));
const getTotalUnreadCount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const result = yield message_services_1.messageServices.getTotalUnreadCount(userId.toString());
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Total unread count fetched successfully",
        data: result,
    });
}));
//Admin Routes
const getConversationsByUserId = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const result = yield message_services_1.messageServices.getConversationsByUserId(userId, Number(page), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User conversations fetched successfully",
        data: result.conversations,
        meta: result.meta,
    });
}));
const getAllConversationMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    const { page = 1, limit = 100 } = req.query;
    const result = yield message_services_1.messageServices.getAllConversationMessages(conversationId, Number(page), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "All conversation messages fetched successfully",
        data: {
            messages: result.messages,
            conversation: result.conversation,
        },
        meta: result.meta,
    });
}));
const searchUserConversations = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm } = req.query;
    const { page = 1, limit = 20 } = req.query;
    const result = yield message_services_1.messageServices.searchUserConversations(searchTerm, Number(page), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User conversations searched successfully",
        data: result.results,
        meta: result.meta,
    });
}));
const editOffer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { messageId } = req.params;
    const { conversationId, agreedFee, checkInDate, checkOutDate, guestNo, offerEdited } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    if (!conversationId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Conversation ID is required");
    }
    const updatedMessage = yield message_services_1.messageServices.editOffer(messageId, conversationId, userId, { agreedFee, checkInDate, checkOutDate, guestNo, offerEdited });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Offer updated successfully",
        data: updatedMessage,
    });
}));
const filterConversationsByUpdatedAt = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filter = "all", page = 1, limit = 20 } = req.query;
    // Don't pass user ID for admin view!
    const result = yield message_services_1.messageServices.filterConversationsByUpdatedAt(filter, Number(page), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Conversations filtered successfully",
        data: result.conversations,
        meta: result.meta,
    });
}));
exports.messageControllers = {
    createConversation,
    getUserConversations,
    getConversationById,
    sendMessage,
    sendMessageAuto,
    getConversationMessages,
    getMessageById,
    markAsRead,
    rejectOffer,
    convertRequestToOfferController,
    convertMakeOfferToRequest,
    acceptOffer,
    markConversationAsRead,
    getTotalUnreadCount,
    // Admin routes
    getConversationsByUserId,
    getAllConversationMessages,
    searchUserConversations,
    //edit offer
    editOffer,
    //new route for filter admin
    filterConversationsByUpdatedAt,
};
