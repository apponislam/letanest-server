"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const subscription_model_1 = require("./subscription.model");
const stripe_services_1 = require("./stripe.services");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createSubscription = (subscriptionData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create product in Stripe first
        const stripeData = yield stripe_services_1.stripeService.createSubscriptionProduct({
            name: subscriptionData.name,
            description: subscriptionData.description,
            type: subscriptionData.type,
            level: subscriptionData.level,
            cost: subscriptionData.cost,
            currency: subscriptionData.currency,
            billingPeriod: subscriptionData.billingPeriod,
        });
        // Create subscription in database with Stripe data
        const subscription = new subscription_model_1.Subscription(Object.assign(Object.assign({}, subscriptionData), { stripeProductId: stripeData.stripeProductId, stripePriceId: stripeData.stripePriceId, paymentLink: stripeData.paymentLink }));
        return yield subscription.save();
    }
    catch (error) {
        console.error("Subscription creation failed:", error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create subscription");
    }
});
const getAllSubscriptions = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (query.type)
        filter.type = query.type;
    if (query.level)
        filter.level = query.level;
    if (query.isActive)
        filter.isActive = query.isActive === "true";
    const [subscriptions, total] = yield Promise.all([subscription_model_1.Subscription.find(filter).sort({ cost: 1, createdAt: -1 }).skip(skip).limit(limit), subscription_model_1.Subscription.countDocuments(filter)]);
    return {
        subscriptions,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
const getAllSubscriptionsAdmin = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (query.type)
        filter.type = query.type;
    if (query.level)
        filter.level = query.level;
    const [subscriptions, total] = yield Promise.all([subscription_model_1.Subscription.find(filter).sort({ cost: 1, createdAt: -1 }).skip(skip).limit(limit), subscription_model_1.Subscription.countDocuments(filter)]);
    return {
        subscriptions,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
const getSubscriptionById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.Subscription.findById(id);
});
const getSubscriptionsByType = (type) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.Subscription.find({ type, isActive: true }).sort({ cost: 1 });
});
const getSubscriptionsByTypeForAdmin = (type) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.Subscription.find({ type }).sort({ cost: 1 });
});
const getActiveSubscriptionsByTypeAndLevel = (type, level) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.Subscription.findOne({ type, level, isActive: true });
});
const updateSubscription = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield subscription_model_1.Subscription.findById(id);
    if (!subscription) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Subscription not found");
    }
    // Update in Stripe if name or description changed
    if (updateData.name || updateData.description) {
        yield stripe_services_1.stripeService.updateSubscriptionProduct(subscription.stripeProductId, {
            name: updateData.name || subscription.name,
            description: updateData.description || subscription.description,
            type: updateData.type || subscription.type,
            level: updateData.level || subscription.level,
            cost: updateData.cost || subscription.cost,
            currency: updateData.currency || subscription.currency,
            billingPeriod: updateData.billingPeriod || subscription.billingPeriod,
        });
    }
    return yield subscription_model_1.Subscription.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
});
const toggleSubscriptionStatus = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield subscription_model_1.Subscription.findById(id);
    if (!subscription) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Subscription not found");
    }
    const updatedSubscription = yield subscription_model_1.Subscription.findByIdAndUpdate(id, { isActive: !subscription.isActive }, { new: true, runValidators: true });
    // Update Stripe product active status
    yield stripe_services_1.stripeService.updateSubscriptionProduct(subscription.stripeProductId, {
        name: subscription.name,
        description: subscription.description,
        type: subscription.type,
        level: subscription.level,
        cost: subscription.cost,
        currency: subscription.currency,
        billingPeriod: subscription.billingPeriod,
    });
    return updatedSubscription;
});
// Get default subscription for new users
const getDefaultSubscription = (type) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.Subscription.findOne({ type, level: "free", isActive: true });
});
// Get subscription by Stripe product ID
const getSubscriptionByStripeProductId = (stripeProductId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.Subscription.findOne({ stripeProductId });
});
// Get subscription by Stripe price ID
const getSubscriptionByStripePriceId = (stripePriceId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscription_model_1.Subscription.findOne({ stripePriceId });
});
// Check if subscription is free tier
const isFreeTier = (subscription) => {
    return stripe_services_1.stripeService.isFreeTier(subscription.paymentLink);
};
// Activate free tier for user (you can implement this based on your user service)
const activateFreeTierForUser = (userId, subscription) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.subscriptionService = {
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
};
