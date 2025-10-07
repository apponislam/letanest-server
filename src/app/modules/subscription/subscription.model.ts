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
        bookingFee: { type: Schema.Types.Mixed },
        bookingLimit: { type: Number },

        // Host specific
        commission: { type: Schema.Types.Mixed }, // Can be number or string
        freeBookings: { type: Number }, // For host free tier (10 free bookings)
        listingLimit: { type: Number }, // Maximum property listings allowed

        // Stripe Integration
        stripeProductId: { type: String, required: true },
        stripePriceId: { type: String, required: true },
        paymentLink: { type: String, required: true },

        // Features
        features: [subscriptionFeatureSchema],
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
