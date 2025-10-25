"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSubscription = void 0;
const mongoose_1 = require("mongoose");
const userSubscriptionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    subscription: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Subscription",
        required: true,
    },
    stripeSubscriptionId: { type: String },
    stripeCustomerId: { type: String },
    stripePriceId: { type: String, required: true },
    status: {
        type: String,
        enum: ["active", "canceled", "past_due", "unpaid", "incomplete"],
        required: true,
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    // For free tiers
    isFreeTier: { type: Boolean, default: false },
    cost: { type: Number },
    currency: { type: String },
    // Snapshot of subscription fields
    bookingFee: { type: Number },
    bookingLimit: { type: Number },
    commission: { type: Number },
    freeBookings: { type: Number },
    listingLimit: { type: Number },
}, {
    timestamps: true,
});
// Add indexes for better performance
userSubscriptionSchema.index({ user: 1 });
userSubscriptionSchema.index({ subscription: 1 });
userSubscriptionSchema.index({ stripeSubscriptionId: 1 });
userSubscriptionSchema.index({ status: 1 });
userSubscriptionSchema.index({ user: 1, status: 1 });
exports.UserSubscription = (0, mongoose_1.model)("UserSubscription", userSubscriptionSchema);
