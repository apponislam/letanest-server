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
exports.botServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const messages_model_1 = require("./messages.model");
const auth_model_1 = require("../auth/auth.model");
const messages_interface_1 = require("./messages.interface");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const socketHandlers_1 = require("../../../socket/socketHandlers");
const messageTypes_model_1 = require("../automessages/messageTypes.model");
const getBotUser = () => __awaiter(void 0, void 0, void 0, function* () {
    const botUser = yield auth_model_1.UserModel.findOne({ isBot: true, role: "ADMIN" });
    if (!botUser) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Bot user not found");
    }
    return botUser;
});
const sendWelcomeMessage = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const botUser = yield getBotUser();
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        // Check if user exists
        const user = yield auth_model_1.UserModel.findById(userObjectId);
        if (!user) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
        }
        // Check if conversation already exists between bot and user
        const existingConversation = yield messages_model_1.Conversation.findOne({
            participants: { $all: [botUser._id, userObjectId] },
            bot: true,
            isActive: true,
        });
        // If conversation already exists, don't send welcome message again
        if (existingConversation) {
            console.log(`ℹ️ Conversation already exists for user ${userId}, skipping welcome message`);
            return null;
        }
        // Get welcome message template or use default
        let messageContent = data.message;
        if (!messageContent) {
            const welcomeTemplate = yield messageTypes_model_1.MessageType.findOne({
                type: "WELCOME",
                isActive: true,
            });
            messageContent = (welcomeTemplate === null || welcomeTemplate === void 0 ? void 0 : welcomeTemplate.content) || "🏡 Welcome to Letanest! We're excited to have you join our community.";
        }
        // Create new conversation
        let conversation;
        try {
            conversation = yield messages_model_1.Conversation.create({
                participants: [botUser._id, userObjectId],
                bot: true,
                isActive: true,
                isReplyAllowed: false,
            });
        }
        catch (error) {
            if (error.code === 11000) {
                // If duplicate key error, try to find the conversation again
                conversation = yield messages_model_1.Conversation.findOne({
                    participants: { $all: [botUser._id, userObjectId] },
                    bot: true,
                    isActive: true,
                });
                if (!conversation) {
                    throw error;
                }
                console.log(`ℹ️ Conversation already exists for user ${userId}, skipping welcome message`);
                return null;
            }
            else {
                throw error;
            }
        }
        yield messages_model_1.Conversation.findByIdAndUpdate(conversation._id, {
            updatedAt: new Date(),
        });
        // Create welcome message that expires in 1 minute
        const welcomeMessage = yield messages_model_1.Message.create({
            conversationId: conversation._id,
            sender: botUser._id,
            type: messages_interface_1.MESSAGE_TYPES.SYSTEM,
            text: messageContent,
            bot: true,
        });
        yield messages_model_1.Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: welcomeMessage._id,
            updatedAt: new Date(),
        });
        const populatedMessage = yield messages_model_1.Message.findById(welcomeMessage._id).populate("sender", "name profileImg email phone role");
        if (!populatedMessage) {
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create welcome message");
        }
        // Emit socket event
        (0, socketHandlers_1.emitToConversation)(conversation._id.toString(), "message:new", {
            message: populatedMessage,
            unreadCount: 1,
            receiverId: userObjectId.toString(),
        });
        console.log(`✅ Welcome message sent to user ${userId} in conversation ${conversation._id}`);
        return populatedMessage;
    }
    catch (error) {
        console.error("❌ Error in sendWelcomeMessage:", error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, `Failed to send welcome message: ${error.message}`);
    }
});
exports.botServices = {
    sendWelcomeMessage,
};
