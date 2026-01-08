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
const sendMessageToAll = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const botUser = yield getBotUser();
        const { messageTypeId, userType = "BOTH" } = data;
        // 1. Get the message template from MessageType using ID
        const messageTemplate = yield messageTypes_model_1.MessageType.findById(messageTypeId);
        if (!messageTemplate) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message template not found");
        }
        if (!messageTemplate.isActive) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Message template is not active");
        }
        const messageContent = messageTemplate.content;
        const messageName = messageTemplate.name;
        console.log(`📢 Sending message "${messageName}" (${messageTemplate.type}) to ${userType} users`);
        // 2. Build query based on userType - CORRECTED: No isDeleted field
        let userQuery = {
            _id: { $ne: botUser._id }, // Don't send to bot itself
            // REMOVED: isDeleted: false, (not in IUser interface)
            // REMOVED: isActive: true, (might not be set)
        };
        if (userType === "GUEST") {
            userQuery.role = "GUEST";
        }
        else if (userType === "HOST") {
            userQuery.role = "HOST";
        }
        else if (userType === "BOTH") {
            userQuery.role = { $in: ["GUEST", "HOST"] };
        }
        console.log("🔍 User Query:", JSON.stringify(userQuery));
        // 3. Get all target users
        const targetUsers = yield auth_model_1.UserModel.find(userQuery).select("_id name email role");
        console.log(`📋 Found ${targetUsers.length} users to send message`);
        if (!targetUsers || targetUsers.length === 0) {
            // For debugging: Show what users actually exist
            const allUsers = yield auth_model_1.UserModel.find({}).select("_id name email role").limit(5);
            console.log("👥 First 5 users in database:", allUsers.map((u) => ({ name: u.name, email: u.email, role: u.role })));
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "No users found to send message to");
        }
        const results = {
            messageTemplate: {
                id: messageTemplate._id,
                name: messageName,
                type: messageTemplate.type,
                content: messageContent,
            },
            userType: userType,
            totalUsers: targetUsers.length,
            successful: 0,
            failed: 0,
            failedUserIds: [],
            successfulUserIds: [],
            errors: [],
        };
        // 4. Send message to each user
        for (const user of targetUsers) {
            try {
                const userObjectId = user._id;
                // Check if conversation already exists between bot and user
                let conversation = yield messages_model_1.Conversation.findOne({
                    participants: { $all: [botUser._id, userObjectId] },
                    bot: true,
                    isActive: true,
                });
                if (!conversation) {
                    // Create new conversation if it doesn't exist
                    conversation = yield messages_model_1.Conversation.create({
                        participants: [botUser._id, userObjectId],
                        bot: true,
                        isActive: true,
                        isReplyAllowed: false,
                    });
                    console.log(`💬 Created new conversation for user ${user._id}`);
                }
                // Update conversation timestamp
                yield messages_model_1.Conversation.findByIdAndUpdate(conversation._id, {
                    updatedAt: new Date(),
                });
                // Create the message (always as SYSTEM type)
                const newMessage = yield messages_model_1.Message.create({
                    conversationId: conversation._id,
                    sender: botUser._id,
                    type: "system", // Always send as SYSTEM type
                    text: messageContent,
                    bot: true,
                });
                // Update conversation with last message
                yield messages_model_1.Conversation.findByIdAndUpdate(conversation._id, {
                    lastMessage: newMessage._id,
                    updatedAt: new Date(),
                });
                // Populate message for socket
                const populatedMessage = yield messages_model_1.Message.findById(newMessage._id).populate("sender", "name profileImg email phone role");
                // Emit socket event
                if (populatedMessage) {
                    (0, socketHandlers_1.emitToConversation)(conversation._id.toString(), "message:new", {
                        message: populatedMessage,
                        unreadCount: 1,
                        receiverId: userObjectId.toString(),
                    });
                }
                results.successful++;
                results.successfulUserIds.push(user._id.toString());
                console.log(`✅ Message sent to ${user.role} user ${user.name} (${user._id})`);
            }
            catch (error) {
                const errorMsg = `Failed to send to user ${user._id}: ${error.message}`;
                console.error(`❌ ${errorMsg}`);
                results.failed++;
                results.failedUserIds.push(user._id.toString());
                results.errors.push(errorMsg);
            }
        }
        console.log(`📊 Message sending completed: ${results.successful} successful, ${results.failed} failed`);
        return results;
    }
    catch (error) {
        console.error("❌ Error in sendMessageToAll:", error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, `Failed to send message: ${error.message}`);
    }
});
// Optional: Get list of active message templates
const getActiveMessageTemplates = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const templates = yield messageTypes_model_1.MessageType.find({ isActive: true }).select("_id name type content variables isActive").sort({ createdAt: -1 });
        return templates;
    }
    catch (error) {
        console.error("❌ Error in getActiveMessageTemplates:", error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to fetch message templates");
    }
});
exports.botServices = {
    sendWelcomeMessage,
    sendMessageToAll,
    getActiveMessageTemplates,
};
