import { Types } from "mongoose";

// Simple Message Types
export const MESSAGE_TYPES = {
    TEXT: "text",
    OFFER: "offer",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

// Base Message Interface
export interface IMessage {
    _id?: Types.ObjectId;
    conversationId: Types.ObjectId;
    sender: Types.ObjectId; // User ID who sent the message
    type: MessageType;
    text?: string; // For text messages

    // For offer messages
    propertyId?: string;
    checkInDate?: string;
    checkOutDate?: string;
    agreedFee?: number;
    bookingFee?: number;
    total?: number;

    // For accepted messages
    propertyName?: string;
    address?: string;
    manager?: string;
    phone?: string;

    // For rejected messages
    reason?: string;

    createdAt?: Date;
    updatedAt?: Date;
}

// Conversation Interface
export interface IConversation {
    _id?: Types.ObjectId;
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
    unreadCount?: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Simple DTO for creating messages
export interface ICreateMessageDto {
    conversationId: string;
    sender: string; // User ID
    type: MessageType;
    text?: string;
    propertyId?: string;
    checkInDate?: string; // ✅ check-in
    checkOutDate?: string; // ✅ check-out
    agreedFee?: number;
    bookingFee?: number;
    total?: number;
    propertyName?: string;
    address?: string;
    manager?: string;
    phone?: string;
    reason?: string;
}

// DTO for creating conversation
export interface ICreateConversationDto {
    participants: string[]; // User IDs
    propertyId?: string; // Optional property reference
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
