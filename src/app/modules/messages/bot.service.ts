import httpStatus from "http-status";
import { Types } from "mongoose";
import { Conversation, Message } from "./messages.model";
import { UserModel } from "../auth/auth.model";
import { MESSAGE_TYPES } from "./messages.interface";
import ApiError from "../../../errors/ApiError";
import { emitToConversation } from "../../../socket/socketHandlers";
import { MessageType } from "../automessages/messageTypes.model";

export interface SendWelcomeMessageDto {
    message?: string;
}

const getBotUser = async () => {
    const botUser = await UserModel.findOne({ isBot: true, role: "ADMIN" });
    if (!botUser) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bot user not found");
    }
    return botUser;
};

const sendWelcomeMessage = async (userId: string, data: SendWelcomeMessageDto) => {
    try {
        const botUser = await getBotUser();
        const userObjectId = new Types.ObjectId(userId);

        // Check if user exists
        const user = await UserModel.findById(userObjectId);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not found");
        }

        // Check if conversation already exists between bot and user
        const existingConversation = await Conversation.findOne({
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
            const welcomeTemplate = await MessageType.findOne({
                type: "WELCOME",
                isActive: true,
            });
            messageContent = welcomeTemplate?.content || "🏡 Welcome to Letanest! We're excited to have you join our community.";
        }

        // Create new conversation
        let conversation;
        try {
            conversation = await Conversation.create({
                participants: [botUser._id, userObjectId],
                bot: true,
                isActive: true,
                isReplyAllowed: false,
            });
        } catch (error: any) {
            if (error.code === 11000) {
                // If duplicate key error, try to find the conversation again
                conversation = await Conversation.findOne({
                    participants: { $all: [botUser._id, userObjectId] },
                    bot: true,
                    isActive: true,
                });
                if (!conversation) {
                    throw error;
                }
                console.log(`ℹ️ Conversation already exists for user ${userId}, skipping welcome message`);
                return null;
            } else {
                throw error;
            }
        }

        await Conversation.findByIdAndUpdate(conversation._id, {
            updatedAt: new Date(),
        });

        // Create welcome message that expires in 1 minute
        const welcomeMessage = await Message.create({
            conversationId: conversation._id,
            sender: botUser._id,
            type: MESSAGE_TYPES.SYSTEM,
            text: messageContent,
            bot: true,
        });

        await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: welcomeMessage._id,
            updatedAt: new Date(),
        });

        const populatedMessage = await Message.findById(welcomeMessage._id).populate("sender", "name profileImg email phone role");

        if (!populatedMessage) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create welcome message");
        }

        // Emit socket event
        emitToConversation(conversation._id.toString(), "message:new", {
            message: populatedMessage,
            unreadCount: 1,
            receiverId: userObjectId.toString(),
        });

        console.log(`✅ Welcome message sent to user ${userId} in conversation ${conversation._id}`);

        return populatedMessage;
    } catch (error: any) {
        console.error("❌ Error in sendWelcomeMessage:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to send welcome message: ${error.message}`);
    }
};

// Send message to all

export interface SendMessageToAllDto {
    messageTypeId: string;
    userType?: "GUEST" | "HOST" | "BOTH";
}

const sendMessageToAll = async (data: SendMessageToAllDto) => {
    try {
        const botUser = await getBotUser();
        const { messageTypeId, userType = "BOTH" } = data;

        // 1. Get the message template from MessageType using ID
        const messageTemplate = await MessageType.findById(messageTypeId);

        if (!messageTemplate) {
            throw new ApiError(httpStatus.NOT_FOUND, "Message template not found");
        }

        if (!messageTemplate.isActive) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Message template is not active");
        }

        const messageContent = messageTemplate.content;
        const messageName = messageTemplate.name;

        console.log(`📢 Sending message "${messageName}" (${messageTemplate.type}) to ${userType} users`);

        // 2. Build query based on userType - CORRECTED: No isDeleted field
        let userQuery: any = {
            _id: { $ne: botUser._id }, // Don't send to bot itself
            // REMOVED: isDeleted: false, (not in IUser interface)
            // REMOVED: isActive: true, (might not be set)
        };

        if (userType === "GUEST") {
            userQuery.role = "GUEST";
        } else if (userType === "HOST") {
            userQuery.role = "HOST";
        } else if (userType === "BOTH") {
            userQuery.role = { $in: ["GUEST", "HOST"] };
        }

        console.log("🔍 User Query:", JSON.stringify(userQuery));

        // 3. Get all target users
        const targetUsers = await UserModel.find(userQuery).select("_id name email role");

        console.log(`📋 Found ${targetUsers.length} users to send message`);

        if (!targetUsers || targetUsers.length === 0) {
            // For debugging: Show what users actually exist
            const allUsers = await UserModel.find({}).select("_id name email role").limit(5);
            console.log(
                "👥 First 5 users in database:",
                allUsers.map((u) => ({ name: u.name, email: u.email, role: u.role }))
            );

            throw new ApiError(httpStatus.NOT_FOUND, "No users found to send message to");
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
            failedUserIds: [] as string[],
            successfulUserIds: [] as string[],
            errors: [] as string[],
        };

        // 4. Send message to each user
        for (const user of targetUsers) {
            try {
                const userObjectId = user._id;

                // Check if conversation already exists between bot and user
                let conversation = await Conversation.findOne({
                    participants: { $all: [botUser._id, userObjectId] },
                    bot: true,
                    isActive: true,
                });

                if (!conversation) {
                    // Create new conversation if it doesn't exist
                    conversation = await Conversation.create({
                        participants: [botUser._id, userObjectId],
                        bot: true,
                        isActive: true,
                        isReplyAllowed: false,
                    });
                    console.log(`💬 Created new conversation for user ${user._id}`);
                }

                // Update conversation timestamp
                await Conversation.findByIdAndUpdate(conversation._id, {
                    updatedAt: new Date(),
                });

                // Create the message (always as SYSTEM type)
                const newMessage = await Message.create({
                    conversationId: conversation._id,
                    sender: botUser._id,
                    type: "system", // Always send as SYSTEM type
                    text: messageContent,
                    bot: true,
                });

                // Update conversation with last message
                await Conversation.findByIdAndUpdate(conversation._id, {
                    lastMessage: newMessage._id,
                    updatedAt: new Date(),
                });

                // Populate message for socket
                const populatedMessage = await Message.findById(newMessage._id).populate("sender", "name profileImg email phone role");

                // Emit socket event
                if (populatedMessage) {
                    emitToConversation(conversation._id.toString(), "message:new", {
                        message: populatedMessage,
                        unreadCount: 1,
                        receiverId: userObjectId.toString(),
                    });
                }

                results.successful++;
                results.successfulUserIds.push(user._id.toString());

                console.log(`✅ Message sent to ${user.role} user ${user.name} (${user._id})`);
            } catch (error: any) {
                const errorMsg = `Failed to send to user ${user._id}: ${error.message}`;
                console.error(`❌ ${errorMsg}`);
                results.failed++;
                results.failedUserIds.push(user._id.toString());
                results.errors.push(errorMsg);
            }
        }

        console.log(`📊 Message sending completed: ${results.successful} successful, ${results.failed} failed`);

        return results;
    } catch (error: any) {
        console.error("❌ Error in sendMessageToAll:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to send message: ${error.message}`);
    }
};

// Optional: Get list of active message templates
const getActiveMessageTemplates = async () => {
    try {
        const templates = await MessageType.find({ isActive: true }).select("_id name type content variables isActive").sort({ createdAt: -1 });

        return templates;
    } catch (error: any) {
        console.error("❌ Error in getActiveMessageTemplates:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch message templates");
    }
};

export const botServices = {
    sendWelcomeMessage,
    sendMessageToAll,
    getActiveMessageTemplates,
};
