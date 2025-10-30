import httpStatus from "http-status";
import { Subscription } from "./subscription.model";
import { ISubscription } from "./subscription.interface";
import { stripeService } from "./stripe.services";
import ApiError from "../../../errors/ApiError";

interface ISubscriptionQuery {
    page?: number;
    limit?: number;
    type?: "GUEST" | "HOST";
    level?: string;
    isActive?: string;
}

const createSubscription = async (subscriptionData: ISubscription): Promise<ISubscription> => {
    try {
        // Create product in Stripe first
        const stripeData = await stripeService.createSubscriptionProduct({
            name: subscriptionData.name,
            description: subscriptionData.description,
            type: subscriptionData.type,
            level: subscriptionData.level,
            cost: subscriptionData.cost,
            currency: subscriptionData.currency,
            billingPeriod: subscriptionData.billingPeriod,
        });

        // Create subscription in database with Stripe data
        const subscription = new Subscription({
            ...subscriptionData,
            stripeProductId: stripeData.stripeProductId,
            stripePriceId: stripeData.stripePriceId,
            paymentLink: stripeData.paymentLink,
        });

        return await subscription.save();
    } catch (error) {
        console.error("Subscription creation failed:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create subscription");
    }
};

const getAllSubscriptions = async (query: ISubscriptionQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.type) filter.type = query.type;
    if (query.level) filter.level = query.level;
    if (query.isActive) filter.isActive = query.isActive === "true";

    const [subscriptions, total] = await Promise.all([Subscription.find(filter).sort({ cost: 1, createdAt: -1 }).skip(skip).limit(limit), Subscription.countDocuments(filter)]);

    return {
        subscriptions,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getAllSubscriptionsAdmin = async (query: ISubscriptionQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
        isDeleted: false,
    };

    if (query.type) filter.type = query.type;
    if (query.level) filter.level = query.level;

    const [subscriptions, total] = await Promise.all([Subscription.find(filter).sort({ cost: 1, createdAt: -1 }).skip(skip).limit(limit), Subscription.countDocuments(filter)]);

    return {
        subscriptions,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getSubscriptionById = async (id: string): Promise<ISubscription | null> => {
    return await Subscription.findById(id);
};

const getSubscriptionsByType = async (type: "GUEST" | "HOST"): Promise<ISubscription[]> => {
    return await Subscription.find({ type, isActive: true, isDeleted: false }).sort({ cost: 1 });
};

const getSubscriptionsByTypeForAdmin = async (type: "GUEST" | "HOST"): Promise<ISubscription[]> => {
    return await Subscription.find({ type, isDeleted: false }).sort({ cost: 1 });
};

const getActiveSubscriptionsByTypeAndLevel = async (type: "GUEST" | "HOST", level: "free" | "premium" | "gold"): Promise<ISubscription | null> => {
    return await Subscription.findOne({ type, level, isActive: true, isDeleted: false });
};

const updateSubscription = async (id: string, updateData: Partial<ISubscription>): Promise<ISubscription | null> => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    // Update in Stripe if name or description changed
    if (updateData.name || updateData.description) {
        await stripeService.updateSubscriptionProduct(subscription.stripeProductId, {
            name: updateData.name || subscription.name,
            description: updateData.description || subscription.description,
            type: updateData.type || subscription.type,
            level: updateData.level || subscription.level,
            cost: updateData.cost || subscription.cost,
            currency: updateData.currency || subscription.currency,
            billingPeriod: updateData.billingPeriod || subscription.billingPeriod,
        });
    }

    return await Subscription.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const toggleSubscriptionStatus = async (id: string): Promise<ISubscription | null> => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(id, { isActive: !subscription.isActive }, { new: true, runValidators: true });

    // Update Stripe product active status
    await stripeService.updateSubscriptionProduct(subscription.stripeProductId, {
        name: subscription.name,
        description: subscription.description,
        type: subscription.type,
        level: subscription.level,
        cost: subscription.cost,
        currency: subscription.currency,
        billingPeriod: subscription.billingPeriod,
    });

    return updatedSubscription;
};

// Get default subscription for new users
const getDefaultSubscription = async (type: "GUEST" | "HOST"): Promise<ISubscription | null> => {
    return await Subscription.findOne({ type, level: "free", isActive: true });
};

// Get subscription by Stripe product ID
const getSubscriptionByStripeProductId = async (stripeProductId: string): Promise<ISubscription | null> => {
    return await Subscription.findOne({ stripeProductId });
};

// Get subscription by Stripe price ID
const getSubscriptionByStripePriceId = async (stripePriceId: string): Promise<ISubscription | null> => {
    return await Subscription.findOne({ stripePriceId });
};

// Check if subscription is free tier
const isFreeTier = (subscription: ISubscription): boolean => {
    return stripeService.isFreeTier(subscription.paymentLink);
};

// Activate free tier for user (you can implement this based on your user service)
const activateFreeTierForUser = async (userId: string, subscription: ISubscription): Promise<void> => {
    if (isFreeTier(subscription)) {
        // Implement your logic to activate free tier for user
        console.log(`Activating free tier for user ${userId}: ${subscription.type} - ${subscription.level}`);
        // Example: update user's subscription in database
        // await User.findByIdAndUpdate(userId, {
        //     subscriptionId: subscription._id,
        //     subscriptionType: subscription.type,
        //     subscriptionLevel: subscription.level
        // });
    }
};

const deleteSubscription = async (id: string): Promise<ISubscription | null> => {
    const subscription = await Subscription.findById(id);

    if (!subscription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    // Soft delete - only set isDeleted to true
    const deletedSubscription = await Subscription.findByIdAndUpdate(
        id,
        {
            isDeleted: true,
            isActive: false, // Also deactivate when deleting
        },
        { new: true }
    );

    return deletedSubscription;
};

export const subscriptionService = {
    createSubscription,
    getAllSubscriptions,
    getAllSubscriptionsAdmin,
    getSubscriptionById,
    getSubscriptionsByType,
    getSubscriptionsByTypeForAdmin,
    getActiveSubscriptionsByTypeAndLevel,
    getDefaultSubscription,
    getSubscriptionByStripeProductId,
    getSubscriptionByStripePriceId,
    updateSubscription,
    toggleSubscriptionStatus,
    isFreeTier,
    activateFreeTierForUser,

    // Delete route
    deleteSubscription,
};
