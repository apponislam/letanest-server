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
exports.botController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const bot_service_1 = require("./bot.service");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const sendWelcomeMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message } = req.body;
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const result = yield bot_service_1.botServices.sendWelcomeMessage(userId, {
        message,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Welcome message sent successfully",
        data: result,
    });
}));
// Send message to all users based on MessageType
const sendMessageToAll = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageTypeId, userType } = req.body;
    if (!messageTypeId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Message Type ID is required");
    }
    const result = yield bot_service_1.botServices.sendMessageToAll({
        messageTypeId,
        userType,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Message "${result.messageTemplate.name}" sent to ${result.successful} ${result.userType} users successfully. ${result.failed} failed.`,
        data: result,
    });
}));
// Get active message templates
const getActiveMessageTemplates = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const templates = yield bot_service_1.botServices.getActiveMessageTemplates();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Active message templates retrieved successfully",
        data: templates,
    });
}));
exports.botController = {
    sendWelcomeMessage,
    sendMessageToAll,
    getActiveMessageTemplates,
};
