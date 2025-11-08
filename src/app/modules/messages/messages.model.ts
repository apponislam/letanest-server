// import mongoose, { Schema, Model } from "mongoose";
// import { IConversation, IMessage, MESSAGE_TYPES } from "./messages.interface";

// const messageSchema = new Schema<IMessage>(
//     {
//         conversationId: {
//             type: Schema.Types.ObjectId,
//             ref: "Conversation",
//             required: true,
//         },
//         sender: {
//             type: Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         type: {
//             type: String,
//             enum: Object.values(MESSAGE_TYPES),
//             required: true,
//         },
//         text: {
//             type: String,
//             required: function (this: IMessage) {
//                 return this.type === MESSAGE_TYPES.TEXT;
//             },
//         },
//         propertyId: {
//             type: Schema.Types.ObjectId,
//             ref: "Property",
//         },
//         checkInDate: String,
//         checkOutDate: String,
//         agreedFee: Number,
//         bookingFee: Number,
//         total: Number,
//         propertyName: String,
//         address: String,
//         manager: String,
//         phone: String,
//         reason: String,
//         guestNo: String,
//         isRead: {
//             type: Boolean,
//             default: false,
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// messageSchema.index({ conversationId: 1, createdAt: -1 });

// // Conversation Schema
// const conversationSchema = new Schema<IConversation>(
//     {
//         participants: [
//             {
//                 type: Schema.Types.ObjectId,
//                 ref: "User",
//                 required: true,
//             },
//         ],
//         lastMessage: {
//             type: Schema.Types.ObjectId,
//             ref: "Message",
//         },
//         unreadCounts: {
//             type: Map,
//             of: Number,
//             default: {},
//         },
//         isActive: {
//             type: Boolean,
//             default: true,
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// conversationSchema.index({ participants: 1 });
// conversationSchema.index({ updatedAt: -1 });

// export const Message: Model<IMessage> = mongoose.model<IMessage>("Message", messageSchema);
// export const Conversation: Model<IConversation> = mongoose.model<IConversation>("Conversation", conversationSchema);

import mongoose, { Schema, Model } from "mongoose";
import { IConversation, IMessage, MESSAGE_TYPES } from "./messages.interface";

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
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
        },
        checkInDate: String,
        checkOutDate: String,
        agreedFee: Number,
        bookingFee: Number,
        total: Number,
        propertyName: String,
        address: String,
        manager: String,
        phone: String,
        reason: String,
        guestNo: String,
        isRead: {
            type: Boolean,
            default: false,
        },
        bot: {
            type: Boolean,
        },
        // Auto-delete fields - SIMPLE APPROACH
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
// CORRECT TTL index - documents will be deleted when expiresAt time is reached
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Auto-delete middleware - set expiration date only for bot messages
messageSchema.pre("save", function (next) {
    // Only set expiration if it's a bot message AND expiresAt is not already set
    if (this.bot === true && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
    next();
});

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
        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        bot: {
            type: Boolean,
        },
        // Auto-delete fields for conversations
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
// CORRECT TTL index for conversations
conversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Auto-delete middleware for conversations
conversationSchema.pre("save", function (next) {
    // Only set expiration if it's a bot conversation AND expiresAt is not already set
    if (this.bot === true && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
    next();
});

// Static method to cleanup expired conversations and messages (manual cleanup as backup)
conversationSchema.statics.cleanupExpired = async function () {
    try {
        const result = await this.deleteMany({
            expiresAt: { $lte: new Date() },
        });

        if (result.deletedCount > 0) {
            console.log(`Cleaned up ${result.deletedCount} expired bot conversations`);
        }
    } catch (error) {
        console.error("Error cleaning up expired conversations:", error);
    }
};

// Static method for messages cleanup (manual cleanup as backup)
messageSchema.statics.cleanupExpired = async function () {
    try {
        const result = await this.deleteMany({
            expiresAt: { $lte: new Date() },
        });

        if (result.deletedCount > 0) {
            console.log(`Cleaned up ${result.deletedCount} expired bot messages`);
        }
    } catch (error) {
        console.error("Error cleaning up expired messages:", error);
    }
};

export const Message: Model<IMessage> = mongoose.model<IMessage>("Message", messageSchema);
export const Conversation: Model<IConversation> = mongoose.model<IConversation>("Conversation", conversationSchema);
