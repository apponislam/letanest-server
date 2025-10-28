import { Types } from "mongoose";

// Simple Message Types
export const MESSAGE_TYPES = {
    TEXT: "text",
    OFFER: "offer",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    REQUEST: "request",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

// Base Message Interface
export interface IMessage {
    _id?: Types.ObjectId;
    conversationId: Types.ObjectId;
    sender: Types.ObjectId;
    type: MessageType;
    text?: string;
    propertyId?: string;
    checkInDate?: string;
    checkOutDate?: string;
    agreedFee?: number;
    bookingFee?: number;
    total?: number;
    propertyName?: string;
    address?: string;
    manager?: string;
    guestNo?: string;
    phone?: string;
    reason?: string;
    isRead?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Conversation Interface
export interface IConversation {
    _id?: Types.ObjectId;
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
    // unreadCount?: number;
    unreadCounts?: {
        // NEW: Per-user unread counts
        [userId: string]: number;
    };
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Simple DTO for creating messages
export interface ICreateMessageDto {
    skip: boolean;
    conversationId: string;
    sender: string;
    type: MessageType;
    text?: string;
    propertyId?: string;
    checkInDate?: string;
    checkOutDate?: string;
    agreedFee?: number;
    bookingFee?: number;
    total?: number;
    propertyName?: string;
    address?: string;
    manager?: string;
    phone?: string;
    reason?: string;
    isRead?: boolean;
}

// DTO for creating conversation
export interface ICreateConversationDto {
    participants: string[];
    propertyId?: string;
}

export interface IMarkAsReadDto {
    conversationId: string;
    messageId: string;
}

// Query interfaces
export interface IMessageQuery {
    conversationId: string;
    page?: number;
    limit?: number;
}

export interface IConversationQuery {
    userId: string;
    page?: number;
    limit?: number;
}
