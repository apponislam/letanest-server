import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { Subscription } from "../subscription/subscription.model";
import { CreateUserSubscriptionData, IUserSubscription } from "./subscribed.interface";
import { UserSubscription } from "./subscribed.model";
import mongoose, { Types } from "mongoose";
import { UserModel } from "../auth/auth.model";

const createUserSubscription = async (data: CreateUserSubscriptionData): Promise<IUserSubscription> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log("🔧 Creating/updating user subscription with data:", data);

        // Validate required fields
        if (!data.userId) throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
        if (!data.subscriptionId) throw new ApiError(httpStatus.BAD_REQUEST, "Subscription ID is required");
        if (!data.stripeCustomerId) throw new ApiError(httpStatus.BAD_REQUEST, "Stripe Customer ID is required");

        const subscription = await Subscription.findById(data.subscriptionId).session(session);
        if (!subscription) {
            throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");
        }

        // Check if the user already has this subscription
        let userSubscription = await UserSubscription.findOne({
            user: new Types.ObjectId(data.userId),
            subscription: new Types.ObjectId(data.subscriptionId),
        }).session(session);

        const userSubscriptionData = {
            user: new Types.ObjectId(data.userId),
            subscription: new Types.ObjectId(data.subscriptionId),
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
            // Update existing subscription
            userSubscription.set(userSubscriptionData);
            await userSubscription.save({ session });
            console.log("🔄 User subscription updated:", userSubscription._id);
        } else {
            // Create new subscription
            userSubscription = new UserSubscription(userSubscriptionData);
            await userSubscription.save({ session });

            // Update the user document with the new subscription _id
            await UserModel.findByIdAndUpdate(
                data.userId,
                {
                    $push: { subscriptions: { subscription: userSubscription._id } },
                },
                { session, new: true }
            );

            console.log("✅ User subscription created and linked to user:", userSubscription._id);
        }

        await session.commitTransaction();
        session.endSession();

        return userSubscription;
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        console.error("❌ User subscription creation/updating failed:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : "Failed to create/update user subscription");
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
