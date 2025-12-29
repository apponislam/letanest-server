"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = exports.Message = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const messages_interface_1 = require("./messages.interface");
const messageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(messages_interface_1.MESSAGE_TYPES),
        required: true,
    },
    text: {
        type: String,
        required: function () {
            return this.type === messages_interface_1.MESSAGE_TYPES.TEXT;
        },
    },
    propertyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Property",
    },
    checkInDate: String,
    checkOutDate: String,
    agreedFee: Number,
    bookingFee: Number,
    bookingFeePaid: {
        type: Boolean,
        default: false,
    },
    hostFeePaid: {
        type: Boolean,
        default: false,
    },
    offerEdited: {
        type: Boolean,
        default: false,
    },
    extraFee: Number,
    extraFeePaid: {
        type: Boolean,
        default: false,
    },
    total: Number,
    propertyName: String,
    address: String,
    manager: String,
    phone: String,
    reason: String,
    guestNo: String,
    reviewed: Boolean,
    isRead: {
        type: Boolean,
        default: false,
    },
    bot: {
        type: Boolean,
    },
    expiresAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// messageSchema.pre("save", function (next) {
//     if (this.bot === true && !this.expiresAt) {
//         this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
//     }
//     next();
// });
// Conversation Schema
const conversationSchema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    isReplyAllowed: Boolean,
    expiresAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
// CORRECT TTL index for conversations
conversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Auto-delete middleware for conversations
// conversationSchema.pre("save", function (next) {
//     if (this.bot === true && !this.expiresAt) {
//         this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
//     }
//     next();
// });
// Static method to cleanup expired conversations and messages (manual cleanup as backup)
conversationSchema.statics.cleanupExpired = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield this.deleteMany({
                expiresAt: { $lte: new Date() },
            });
            if (result.deletedCount > 0) {
                console.log(`Cleaned up ${result.deletedCount} expired bot conversations`);
            }
        }
        catch (error) {
            console.error("Error cleaning up expired conversations:", error);
        }
    });
};
// Static method for messages cleanup (manual cleanup as backup)
messageSchema.statics.cleanupExpired = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield this.deleteMany({
                expiresAt: { $lte: new Date() },
            });
            if (result.deletedCount > 0) {
                console.log(`Cleaned up ${result.deletedCount} expired bot messages`);
            }
        }
        catch (error) {
            console.error("Error cleaning up expired messages:", error);
        }
    });
};
exports.Message = mongoose_1.default.model("Message", messageSchema);
exports.Conversation = mongoose_1.default.model("Conversation", conversationSchema);
