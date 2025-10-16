import { Types } from "mongoose";

export interface IPayment {
    _id?: Types.ObjectId;

    // Stripe
    stripePaymentIntentId: string;

    // Money breakdown
    agreedFee: number;
    bookingFee: number;
    extraFee?: number;
    totalAmount: number;

    commissionRate: number;
    commissionAmount: number;
    hostAmount: number;
    platformTotal: number;

    // Booking details
    checkInDate?: Date;
    checkOutDate?: Date;

    // Relationships
    userId: Types.ObjectId;
    propertyId: Types.ObjectId;
    conversationId: Types.ObjectId;
    messageId: Types.ObjectId;

    // Status - EXPAND to match actual backend logic
    status: "pending" | "completed" | "failed" | "canceled" | "processing" | "requires_action";
    stripePaymentStatus?: string; // Store actual Stripe status

    createdAt?: Date;
    paidAt?: Date;
}

export interface CreatePaymentData {
    agreedFee: number;
    bookingFee: number;
    extraFee?: number;
    totalAmount: number;
    commissionRate?: number;

    // Booking details
    checkInDate?: Date;
    checkOutDate?: Date;

    userId: string;
    propertyId: string;
    conversationId: string;
    messageId: string;
}
