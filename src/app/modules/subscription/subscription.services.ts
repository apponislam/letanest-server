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

const getSubscriptionById = async (id: string): Promise<ISubscription | null> => {
    return await Subscription.findById(id);
};

const getSubscriptionsByType = async (type: "GUEST" | "HOST"): Promise<ISubscription[]> => {
    return await Subscription.find({ type, isActive: true }).sort({ cost: 1 });
};

const updateSubscription = async (id: string, updateData: Partial<ISubscription>): Promise<ISubscription | null> => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    // Update in Stripe if name or description changed
    if (updateData.name || updateData.description) {
        await stripeService.updateSubscriptionProduct(subscription.stripeProductId, {
            name: updateData.name,
            description: updateData.description,
            type: updateData.type,
            level: updateData.level,
        });
    }

    return await Subscription.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const deleteSubscription = async (id: string): Promise<ISubscription | null> => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    // Archive in Stripe
    await stripeService.archiveSubscriptionProduct(subscription.stripeProductId);

    // Delete from database
    return await Subscription.findByIdAndDelete(id);
};

const toggleSubscriptionStatus = async (id: string): Promise<ISubscription | null> => {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(id, { isActive: !subscription.isActive }, { new: true, runValidators: true });

    // Update Stripe product active status
    await stripeService.updateSubscriptionProduct(subscription.stripeProductId, {});

    return updatedSubscription;
};

export const subscriptionService = {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    getSubscriptionsByType,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionStatus,
};
