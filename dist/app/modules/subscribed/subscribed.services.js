"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.userSubscriptionService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const subscription_model_1 = require("../subscription/subscription.model");
const subscribed_model_1 = require("./subscribed.model");
const mongoose_1 = __importStar(require("mongoose"));
const auth_model_1 = require("../auth/auth.model");
const stripe_services_1 = require("../subscription/stripe.services");
const createUserSubscription = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        console.log("🔧 Creating/updating user subscription with data:", data);
        if (!data.userId)
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
        if (!data.subscriptionId)
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Subscription ID is required");
        if (!data.stripeCustomerId)
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Stripe Customer ID is required");
        const subscription = yield subscription_model_1.Subscription.findById(data.subscriptionId).session(session);
        if (!subscription) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Subscription plan not found");
        }
        const user = yield auth_model_1.UserModel.findById(data.userId).session(session);
        if (user === null || user === void 0 ? void 0 : user.currentSubscription) {
            yield subscribed_model_1.UserSubscription.findByIdAndUpdate(user.currentSubscription, {
                status: "canceled",
                cancelAtPeriodEnd: true,
                cancelledAt: new Date(),
            }, { session });
        }
        // Check if the user already has this subscription
        let userSubscription = yield subscribed_model_1.UserSubscription.findOne({
            user: new mongoose_1.Types.ObjectId(data.userId),
            subscription: new mongoose_1.Types.ObjectId(data.subscriptionId),
        }).session(session);
        const userSubscriptionData = {
            user: new mongoose_1.Types.ObjectId(data.userId),
            subscription: new mongoose_1.Types.ObjectId(data.subscriptionId),
            stripeSubscriptionId: data.stripeSubscriptionId,
            stripeCustomerId: data.stripeCustomerId,
            stripePriceId: data.stripePriceId,
            status: data.status,
            currentPeriodStart: data.currentPeriodStart,
            currentPeriodEnd: data.currentPeriodEnd,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            bookingFee: subscription.bookingFee,
            bookingLimit: subscription.bookingLimit,
            commission: subscription.commission,
            freeBookings: subscription.freeBookings,
            listingLimit: subscription.listingLimit,
            isFreeTier: data.isFreeTier,
            cost: subscription.cost,
            currency: subscription.currency,
        };
        if (userSubscription) {
            userSubscription.set(userSubscriptionData);
            yield userSubscription.save({ session });
            console.log("🔄 User subscription updated:", userSubscription._id);
        }
        else {
            userSubscription = new subscribed_model_1.UserSubscription(userSubscriptionData);
            yield userSubscription.save({ session });
            yield auth_model_1.UserModel.findByIdAndUpdate(data.userId, {
                $push: { subscriptions: { subscription: userSubscription._id } },
                $set: { currentSubscription: userSubscription._id },
            }, { session, new: true });
            console.log("✅ User subscription created and linked to user:", userSubscription._id);
        }
        yield auth_model_1.UserModel.findByIdAndUpdate(data.userId, { $set: { currentSubscription: userSubscription._id } }, { session });
        yield session.commitTransaction();
        session.endSession();
        return userSubscription;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : "Failed to create/update user subscription");
    }
});
const getUserSubscriptions = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscribed_model_1.UserSubscription.find({ user: userId }).populate("subscription").sort({ createdAt: -1 });
});
const getActiveUserSubscription = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscribed_model_1.UserSubscription.findOne({
        user: userId,
        status: "active",
    }).populate("subscription");
});
const getUserSubscriptionById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscribed_model_1.UserSubscription.findById(id).populate("subscription").populate("user");
});
const updateUserSubscriptionStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscribed_model_1.UserSubscription.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).populate("subscription");
});
const cancelUserSubscription = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Get the user subscription
        const userSubscription = yield subscribed_model_1.UserSubscription.findById(id).session(session);
        if (!userSubscription) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Subscription not found");
        }
        // Check if this subscription belongs to the user
        if (userSubscription.user.toString() !== userId) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "You don't have permission to cancel this subscription");
        }
        // Check if already cancelled
        if (userSubscription.status === "canceled") {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Subscription is already cancelled");
        }
        // If it's a paid subscription with Stripe, cancel in Stripe
        if (userSubscription.stripeSubscriptionId && !userSubscription.isFreeTier) {
            try {
                yield stripe_services_1.stripeService.cancelSubscription(userSubscription.stripeSubscriptionId);
                console.log(`✅ Stripe subscription ${userSubscription.stripeSubscriptionId} cancelled`);
            }
            catch (error) {
                console.error("Failed to cancel Stripe subscription:", error);
                // Continue anyway to update our database
            }
        }
        // Update in database
        const updated = yield subscribed_model_1.UserSubscription.findByIdAndUpdate(id, {
            status: "canceled",
            cancelAtPeriodEnd: true,
            cancelledAt: new Date(),
        }, { new: true, session, runValidators: true }).populate("subscription");
        // Update user's current subscription if this is the active one
        const user = yield auth_model_1.UserModel.findById(userId).session(session);
        if (((_a = user === null || user === void 0 ? void 0 : user.currentSubscription) === null || _a === void 0 ? void 0 : _a.toString()) === id) {
            yield auth_model_1.UserModel.findByIdAndUpdate(userId, { $unset: { currentSubscription: "" } }, { session });
        }
        yield session.commitTransaction();
        session.endSession();
        return updated;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const incrementBookingCount = (userSubscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscribed_model_1.UserSubscription.findByIdAndUpdate(userSubscriptionId, { $inc: { bookingCount: 1 } }, { new: true, runValidators: true });
});
const incrementFreeBookingCount = (userSubscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscribed_model_1.UserSubscription.findByIdAndUpdate(userSubscriptionId, { $inc: { freeBookingCount: 1 } }, { new: true, runValidators: true });
});
const getUserSubscriptionByStripeId = (stripeSubscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscribed_model_1.UserSubscription.findOne({ stripeSubscriptionId }).populate("subscription").populate("user");
});
const updateUserSubscriptionByStripeId = (stripeSubscriptionId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield subscribed_model_1.UserSubscription.findOneAndUpdate({ stripeSubscriptionId }, updateData, { new: true, runValidators: true }).populate("subscription");
});
exports.userSubscriptionService = {
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
