import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { Subscription } from "../subscription/subscription.model";
import { CreateUserSubscriptionData, IUserSubscription } from "./subscribed.interface";
import { UserSubscription } from "./subscribed.model";
import { Types } from "mongoose";

// In user-subscription.services.ts
const createUserSubscription = async (data: CreateUserSubscriptionData): Promise<IUserSubscription> => {
    try {
        console.log("🔧 Creating user subscription with data:", data);

        // Validate required fields
        if (!data.userId) {
            throw new Error("User ID is required");
        }
        if (!data.subscriptionId) {
            throw new Error("Subscription ID is required");
        }
        if (!data.stripeCustomerId) {
            throw new Error("Stripe Customer ID is required");
        }

        // Convert string IDs to ObjectId if needed
        const userSubscriptionData = {
            user: new Types.ObjectId(data.userId), // Convert to ObjectId
            subscription: new Types.ObjectId(data.subscriptionId), // Convert to ObjectId
            stripeSubscriptionId: data.stripeSubscriptionId,
            stripeCustomerId: data.stripeCustomerId, // Should be a string like "cus_xxx"
            stripePriceId: data.stripePriceId,
            status: data.status,
            currentPeriodStart: data.currentPeriodStart,
            currentPeriodEnd: data.currentPeriodEnd,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            isFreeTier: data.isFreeTier,
        };

        console.log("🔧 Final data for UserSubscription creation:", userSubscriptionData);

        const userSubscription = new UserSubscription(userSubscriptionData);
        const result = await userSubscription.save();

        console.log("✅ User subscription saved successfully:", result._id);
        return result;
    } catch (error) {
        console.error("❌ User subscription creation failed:", error);
        throw new Error(`Failed to create user subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};

const getUserSubscriptions = async (userId: string): Promise<IUserSubscription[]> => {
    return await UserSubscription.find({ user: userId }).populate("subscription").sort({ createdAt: -1 });
};

const getActiveUserSubscription = async (userId: string): Promise<IUserSubscription | null> => {
    return await UserSubscription.findOne({
        user: userId,
        status: "active",
    }).populate("subscription");
};

const getUserSubscriptionById = async (id: string): Promise<IUserSubscription | null> => {
    return await UserSubscription.findById(id).populate("subscription").populate("user");
};

const updateUserSubscriptionStatus = async (id: string, status: IUserSubscription["status"]): Promise<IUserSubscription | null> => {
    return await UserSubscription.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).populate("subscription");
};

const cancelUserSubscription = async (id: string): Promise<IUserSubscription | null> => {
    return await UserSubscription.findByIdAndUpdate(
        id,
        {
            status: "canceled",
            cancelAtPeriodEnd: true,
        },
        { new: true, runValidators: true }
    ).populate("subscription");
};

const incrementBookingCount = async (userSubscriptionId: string): Promise<IUserSubscription | null> => {
    return await UserSubscription.findByIdAndUpdate(userSubscriptionId, { $inc: { bookingCount: 1 } }, { new: true, runValidators: true });
};

const incrementFreeBookingCount = async (userSubscriptionId: string): Promise<IUserSubscription | null> => {
    return await UserSubscription.findByIdAndUpdate(userSubscriptionId, { $inc: { freeBookingCount: 1 } }, { new: true, runValidators: true });
};

const getUserSubscriptionByStripeId = async (stripeSubscriptionId: string): Promise<IUserSubscription | null> => {
    return await UserSubscription.findOne({ stripeSubscriptionId }).populate("subscription").populate("user");
};

const updateUserSubscriptionByStripeId = async (stripeSubscriptionId: string, updateData: Partial<IUserSubscription>): Promise<IUserSubscription | null> => {
    return await UserSubscription.findOneAndUpdate({ stripeSubscriptionId }, updateData, { new: true, runValidators: true }).populate("subscription");
};

export const userSubscriptionService = {
    createUserSubscription,
    getUserSubscriptions,
    getActiveUserSubscription,
    getUserSubscriptionById,
    updateUserSubscriptionStatus,
    cancelUserSubscription,
    incrementBookingCount,
    incrementFreeBookingCount,
    getUserSubscriptionByStripeId,
    updateUserSubscriptionByStripeId,
};
