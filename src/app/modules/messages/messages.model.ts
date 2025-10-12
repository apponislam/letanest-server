import mongoose, { Schema, Model } from "mongoose";
import { IConversation, IMessage, MESSAGE_TYPES } from "./messages.interface";

// Message Schema (same as before)
const messageSchema = new Schema<IMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(MESSAGE_TYPES),
            required: true,
        },
        text: {
            type: String,
            required: function (this: IMessage) {
                return this.type === MESSAGE_TYPES.TEXT;
            },
        },
        propertyId: String,
        dates: String,
        agreedFee: String,
        bookingFee: String,
        total: String,
        propertyName: String,
        address: String,
        manager: String,
        phone: String,
        reason: String,
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

// Conversation Schema
const conversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
        unreadCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>("Message", messageSchema);
export const Conversation: Model<IConversation> = mongoose.model<IConversation>("Conversation", conversationSchema);
