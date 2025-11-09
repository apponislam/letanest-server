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

        // Get welcome message template or use default
        let messageContent = data.message;
        if (!messageContent) {
            const welcomeTemplate = await MessageType.findOne({
                type: "WELCOME",
                isActive: true,
            });
            messageContent = welcomeTemplate?.content || "🏡 Welcome to Letanest! We're excited to have you join our community.";
        }

        // SIMPLE SOLUTION: Just find or create without complex operations
        let conversation = await Conversation.findOne({
            participants: { $all: [botUser._id, userObjectId] },
            bot: true,
            isActive: true,
        });

        if (!conversation) {
            try {
                conversation = await Conversation.create({
                    participants: [botUser._id, userObjectId],
                    bot: true,
                    isActive: true,
                    expiresAt: new Date(Date.now() + 60 * 1000),
                });
            } catch (error: any) {
                // If creation fails due to duplicate (race condition), find the existing one
                if (error.code === 11000) {
                    conversation = await Conversation.findOne({
                        participants: { $all: [botUser._id, userObjectId] },
                        bot: true,
                        isActive: true,
                    });
                    if (!conversation) {
                        throw error; // Re-throw if still not found
                    }
                } else {
                    throw error;
                }
            }
        }

        // Update conversation timestamp
        await Conversation.findByIdAndUpdate(conversation._id, {
            updatedAt: new Date(),
        });

        // Create welcome message that expires in 1 minute
        const welcomeMessage = await Message.create({
            conversationId: conversation._id,
            sender: botUser._id,
            type: MESSAGE_TYPES.TEXT,
            text: messageContent,
            bot: true,
            expiresAt: new Date(Date.now() + 60 * 1000),
        });

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: welcomeMessage._id,
            updatedAt: new Date(),
        });

        // Populate the message for response
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

export const botServices = {
    sendWelcomeMessage,
};
