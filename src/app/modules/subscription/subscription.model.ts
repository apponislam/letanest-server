// models/subscription.model.ts
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
            enum: ["free", "premium", "silver", "gold"],
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
        bookingFee: { type: Schema.Types.Mixed, required: true },
        commission: { type: Number },
        bookingLimit: { type: Number },

        // Stripe Integration
        stripeProductId: { type: String, required: true },
        stripePriceId: { type: String, required: true },
        paymentLink: { type: String, required: true },

        // Features
        features: [subscriptionFeatureSchema],
        perks: [{ type: String }],
        badge: { type: String },

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
subscriptionSchema.index({ isActive: 1 });
subscriptionSchema.index({ stripeProductId: 1 });
subscriptionSchema.index({ stripePriceId: 1 });

export const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
