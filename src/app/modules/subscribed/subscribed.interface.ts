import { Types } from "mongoose";

export interface IUserSubscription {
    _id?: string;
    user: Types.ObjectId;
    subscription: Types.ObjectId;
    stripeSubscriptionId?: string;
    stripeCustomerId: string;
    stripePriceId: string;
    status: "active" | "canceled" | "past_due" | "unpaid" | "incomplete";
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    isFreeTier: boolean;
    cost?: number;
    currency?: string;
    bookingFee?: number;
    bookingLimit?: number;
    commission?: number;
    freeBookings?: number;
    listingLimit?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateUserSubscriptionData {
    userId: string;
    subscriptionId: string;
    stripeSubscriptionId?: string;
    stripeCustomerId: string;
    stripePriceId: string;
    status: IUserSubscription["status"];
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    isFreeTier: boolean;
}
