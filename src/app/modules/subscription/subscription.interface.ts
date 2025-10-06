// interfaces/subscription.interface.ts
export interface ISubscriptionFeature {
    name: string;
    included: boolean;
}

export interface ISubscription {
    _id?: string;
    name: string;
    type: "GUEST" | "HOST";
    level: "free" | "premium" | "silver" | "gold";
    billingPeriod: "monthly" | "annual" | "none";

    // Pricing
    cost: number;
    currency: string;
    bookingFee: number | string;
    commission?: number;
    bookingLimit?: number;

    // Stripe Integration
    stripeProductId: string;
    stripePriceId: string;
    paymentLink: string;

    // Features
    features: ISubscriptionFeature[];
    perks: string[];
    badge?: string;

    // Metadata
    description: string;
    isActive: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}
