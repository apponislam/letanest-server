import { Document, Types } from "mongoose";

export interface IUserSubscription {
    _id?: string;
    user: Types.ObjectId; // Should be ObjectId, not string
    subscription: Types.ObjectId; // Should be ObjectId, not string
    stripeSubscriptionId?: string;
    stripeCustomerId: string; // Should be string, not object
    stripePriceId: string;
    status: "active" | "canceled" | "past_due" | "unpaid" | "incomplete";
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    isFreeTier: boolean;
    bookingCount?: number;
    freeBookingCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateUserSubscriptionData {
    userId: string; // String that can be converted to ObjectId
    subscriptionId: string; // String that can be converted to ObjectId
    stripeSubscriptionId?: string;
    stripeCustomerId: string; // String ID like "cus_xxx"
    stripePriceId: string;
    status: IUserSubscription["status"];
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    isFreeTier: boolean;
}
