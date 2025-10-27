import { Schema, model } from "mongoose";
import { ISubscription } from "./subscription.interface";

const subscriptionFeatureSchema = new Schema(
    {
        name: { type: String, required: true },
        included: { type: Boolean, required: true, default: true },
    },
    { _id: false }
);

const subscriptionSchema = new Schema<ISubscription>(
    {
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ["GUEST", "HOST"],
            required: true,
        },
        level: {
            type: String,
            enum: ["free", "premium", "gold"],
            required: true,
        },
        billingPeriod: {
            type: String,
            enum: ["monthly", "annual", "none"],
            required: true,
        },

        // Pricing
        cost: { type: Number, required: true, default: 0 },
        currency: { type: String, required: true, default: "gbp" },

        // Guest specific
        bookingFee: { type: Number, required: true, default: 0 },
        bookingLimit: { type: Number },

        // Host specific
        commission: { type: Number },
        freeBookings: { type: Number },
        listingLimit: { type: Number },

        // Stripe Integration
        stripeProductId: { type: String, required: true },
        stripePriceId: { type: String, required: true },
        paymentLink: { type: String, required: true },

        // Features
        features: [subscriptionFeatureSchema],
        badge: { type: String },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        // Metadata
        description: { type: String, required: true },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

// Add indexes for better performance
subscriptionSchema.index({ type: 1, level: 1 });
subscriptionSchema.index({ isDeleted: 1, isActive: 1 });
subscriptionSchema.index({ stripeProductId: 1 });
subscriptionSchema.index({ stripePriceId: 1 });

export const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
