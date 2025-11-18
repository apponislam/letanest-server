import { Types } from "mongoose";

// Simple Message Types
export const MESSAGE_TYPES = {
    TEXT: "text",
    OFFER: "offer",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    REQUEST: "request",
    REVIEW: "review",
    MAKEOFFER: "makeoffer",
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
    bookingFeePaid?: boolean;
    extraFee?: number;
    extraFeePaid?: boolean;
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
    bot?: boolean;
    expiresAt?: Date;
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
    bot?: boolean;
    expiresAt?: Date;
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
    bookingFeePaid?: boolean;
    total?: number;
    guestNo?: string;
    propertyName?: string;
    address?: string;
    manager?: string;
    phone?: string;
    reason?: string;
    isRead?: boolean;
    bot?: boolean;
}

export interface ICreateConversationDto {
    participants: string[];
    propertyId?: string;
    bot?: boolean;
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
