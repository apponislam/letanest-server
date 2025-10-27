export interface ISubscriptionFeature {
    name: string;
    included: boolean;
}

export interface ISubscription {
    _id?: string;
    name: string;
    type: "GUEST" | "HOST";
    level: "free" | "premium" | "gold";
    billingPeriod: "monthly" | "annual" | "none";

    // Pricing
    cost: number;
    currency: string;

    // Guest specific
    bookingFee: number;
    bookingLimit?: number;

    // Host specific
    commission?: number;
    freeBookings?: number;
    listingLimit?: number;

    // Stripe Integration
    stripeProductId: string;
    stripePriceId: string;
    paymentLink: string;

    // Features
    features: ISubscriptionFeature[];
    badge?: string;

    // Metadata
    description: string;
    isActive: boolean;

    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
