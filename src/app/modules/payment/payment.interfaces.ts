import { Types } from "mongoose";

export interface IPayment {
    _id?: Types.ObjectId;
    stripePaymentIntentId: string;
    agreedFee: number;
    bookingFee: number;
    extraFee?: number;
    extraFeePaid?: boolean;
    totalAmount: number;
    commissionRate: number;
    commissionAmount: number;
    hostAmount: number;
    platformTotal: number;
    checkInDate?: Date;
    checkOutDate?: Date;
    userId: Types.ObjectId;
    propertyId: Types.ObjectId;
    conversationId: Types.ObjectId;
    messageId: Types.ObjectId;
    hostId: Types.ObjectId;
    status: "pending" | "completed" | "failed" | "canceled" | "processing" | "requires_action";
    stripePaymentStatus?: string;
    paymentType?: "Stripe" | "Bank";
    isBookingFeePaidOnly?: boolean;
    bookingFeePaidDone?: number;
    comissionPaidDone?: number;
    commissionPaid?: boolean;
    createdAt?: Date;
    paidAt?: Date;
}

export interface CreatePaymentData {
    agreedFee: number;
    bookingFee: number;
    extraFee?: number;
    totalAmount: number;
    commissionRate?: number;
    checkInDate?: Date;
    checkOutDate?: Date;
    userId: string;
    propertyId: string;
    conversationId: string;
    messageId: string;
    hostId: string;
}
