import { Types } from "mongoose";
import { IUser } from "../auth/auth.interface";
import { UserModel } from "../auth/auth.model";
import { IUpdateUserProfile } from "./user.interface";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";
import { Subscription } from "../subscription/subscription.model";
import { stripeService } from "../subscription/stripe.services";
import config from "../../config";

interface IUserQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: string;
}

const getAllUsersService = async (query: IUserQuery) => {
    const { page = 1, limit = 10, search, role, isActive } = query;

    const filter: Record<string, any> = {};

    if (search) {
        filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
    }

    if (role) filter.role = role;
    if (isActive) filter.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([UserModel.find(filter).select("-password").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), UserModel.countDocuments(filter)]);

    return {
        users,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

const getSingleUserService = async (id: string): Promise<IUser | null> => {
    return await UserModel.findById(id).select("-password");
};

const updateUserProfileService = async (userId: Types.ObjectId, updateData: IUpdateUserProfile, profileImg?: Express.Multer.File): Promise<IUser | null> => {
    const updateFields: any = {
        name: `${updateData.firstName} ${updateData.lastName}`,
        phone: updateData.phone,
        address: updateData.address,
        gender: updateData.gender,
    };

    if (profileImg) {
        updateFields.profileImg = `/uploads/profile/${profileImg.filename}`;
    }

    return await UserModel.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true }).select("-password");
};

const getMySubscriptionsService = async (userId: Types.ObjectId): Promise<IUser | null> => {
    const user = await UserModel.findById(userId)
        .select("name email role profileImg subscriptions freeTireUsed freeTireExpiry")
        .populate({
            path: "subscriptions.subscription",
            model: "UserSubscription",
        })
        .populate({
            path: "freeTireSub",
            model: "Subscription",
            select: "billingPeriod bookingFee level paymentLink type freeBookings listingLimit commission",
        });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
};

// ONLY THIS NEW SERVICE - Activate free tier
// const activateFreeTierService = async (userId: Types.ObjectId, subscriptionId: string) => {
//     // Calculate expiry date (30 days from now for free tier)
//     const freeTireExpiry = new Date();
//     freeTireExpiry.setDate(freeTireExpiry.getDate() + 30);

//     // Update user with free tier data
//     const updatedUser = await UserModel.findByIdAndUpdate(
//         userId,
//         {
//             freeTireUsed: true,
//             freeTireExpiry: freeTireExpiry,
//             freeTireSub: new Types.ObjectId(subscriptionId),
//         },
//         { new: true }
//     ).populate("freeTireSub");

//     return {
//         freeTireUsed: updatedUser?.freeTireUsed,
//         freeTireExpiry: updatedUser?.freeTireExpiry,
//         freeTireSub: updatedUser?.freeTireSub,
//     };
// };

const activateFreeTierService = async (userId: Types.ObjectId, subscriptionId: string) => {
    // Calculate expiry date (30 days from now for free tier)
    const freeTireExpiry = new Date();
    freeTireExpiry.setDate(freeTireExpiry.getDate() + 30);

    // Fetch subscription to get free tier data
    const subscription = await Subscription.findById(subscriptionId).lean();
    const freeTireData = subscription
        ? {
              commission: subscription.commission || null,
              freeBookings: subscription.freeBookings || null,
              listingLimit: subscription.listingLimit || null,
              bookingFee: subscription.bookingFee || null,
              bookingLimit: subscription.bookingLimit || null,
          }
        : {};

    // Update user with free tier info and optional data
    const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
            freeTireUsed: true,
            freeTireExpiry,
            freeTireSub: new Types.ObjectId(subscriptionId),
            freeTireData, // save the optional numeric data
        },
        { new: true }
    ).populate("freeTireSub");

    return {
        freeTireUsed: updatedUser?.freeTireUsed,
        freeTireExpiry: updatedUser?.freeTireExpiry,
        freeTireSub: updatedUser?.freeTireSub,
        freeTireData: updatedUser?.freeTireData,
    };
};

// Stripe Account connect

/**
 * Connect host to Stripe
 */
const connectStripeAccountService = async (userId: string) => {
    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Check if user is a host
    // if (user.role !== "HOST") {
    //     throw new ApiError(httpStatus.BAD_REQUEST, "Only hosts can connect Stripe accounts");
    // }

    // Check if already has Stripe account
    if (user.hostStripeAccount && user.hostStripeAccount.status === "verified") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Stripe account already connected");
    }

    // Create Stripe Connect account
    const account = await stripeService.createConnectAccount(userId, user.email, user.name);

    // Create account link for onboarding
    const accountLink = await stripeService.createAccountLink(account.id, userId);

    // Save Stripe account ID to user (pending status)
    user.hostStripeAccount = {
        stripeAccountId: account.id,
        status: "pending",
        createdAt: new Date(),
    };
    await user.save();

    return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
        status: "pending",
    };
};

/**
 * Get Stripe Connect account status
 */
// const getStripeAccountStatusService = async (userId: string) => {
//     const user = await UserModel.findById(userId);
//     if (!user || !user.hostStripeAccount) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Stripe account not found");
//     }

//     // Get current status from Stripe
//     const stripeStatus = await stripeService.getConnectAccountStatus(user.hostStripeAccount.stripeAccountId);
//     console.log(stripeStatus);

//     // Convert Stripe status to our app status type
//     let appStatus: "pending" | "verified" | "rejected";
//     if (stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled) {
//         appStatus = "verified";
//     } else if (config.node_env === "development" && stripeStatus.chargesEnabled) {
//         appStatus = "verified";
//     } else if (stripeStatus.detailsSubmitted && !stripeStatus.chargesEnabled) {
//         appStatus = "rejected";
//     } else {
//         appStatus = "pending";
//     }

//     // Update user status if changed
//     if (appStatus !== user.hostStripeAccount.status) {
//         user.hostStripeAccount.status = appStatus;
//         if (appStatus === "verified") {
//             user.hostStripeAccount.verifiedAt = new Date();
//         }
//         await user.save();
//     }

//     return {
//         status: user.hostStripeAccount.status,
//         stripeStatus: stripeStatus,
//         accountId: user.hostStripeAccount.stripeAccountId,
//     };
// };

const getStripeAccountStatusService = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user || !user.hostStripeAccount) {
        throw new ApiError(httpStatus.NOT_FOUND, "Stripe account not found");
    }

    const stripeStatus = await stripeService.getConnectAccountStatus(user.hostStripeAccount.stripeAccountId);

    let appStatus: "pending" | "verified" | "rejected";
    if (stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled) {
        appStatus = "verified";
    } else if (config.node_env === "development" && stripeStatus.chargesEnabled) {
        appStatus = "verified";
    } else if (stripeStatus.detailsSubmitted && !stripeStatus.chargesEnabled) {
        appStatus = "rejected";
    } else {
        appStatus = "pending";
    }

    if (appStatus !== user.hostStripeAccount.status) {
        user.hostStripeAccount.status = appStatus;
        if (appStatus === "verified") {
            user.hostStripeAccount.verifiedAt = new Date();
        }
        await user.save();
    }

    return {
        status: user.hostStripeAccount.status,
        stripeStatus: stripeStatus,
        accountId: user.hostStripeAccount.stripeAccountId,
    };
};

/**
 * Get Stripe dashboard link
 */
const getStripeDashboardService = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user || !user.hostStripeAccount) {
        throw new ApiError(httpStatus.NOT_FOUND, "Stripe account not found");
    }

    const loginLink = await stripeService.createLoginLink(user.hostStripeAccount.stripeAccountId);

    return {
        dashboardUrl: loginLink.url,
    };
};

/**
 * Disconnect Stripe account
 */
const disconnectStripeAccountService = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user || !user.hostStripeAccount) {
        throw new ApiError(httpStatus.NOT_FOUND, "Stripe account not found");
    }

    // Remove Stripe account from user
    user.hostStripeAccount = undefined;
    await user.save();

    return {
        success: true,
        message: "Stripe account disconnected successfully",
    };
};

const getMyProfileService = async (userId: Types.ObjectId): Promise<any> => {
    const user = await UserModel.findById(userId)
        .select("-password")
        .populate({
            path: "subscriptions.subscription",
            model: "UserSubscription",
            populate: {
                path: "subscription",
                model: "Subscription",
                select: "badge",
            },
        })
        .populate({
            path: "freeTireSub",
            model: "Subscription",
            select: "billingPeriod bookingFee level paymentLink type freeBookings listingLimit commission",
        })
        .lean();

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Return structured profile data
    return {
        profile: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileImg: user.profileImg,
            gender: user.gender,
            address: user.address,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            verificationStatus: user.verificationStatus,
        },
        subscriptions: {
            activeSubscriptions: user.subscriptions,
            freeTier: {
                used: user.freeTireUsed,
                expiry: user.freeTireExpiry,
                subscription: user.freeTireSub,
                data: user.freeTireData,
            },
        },
        stripe: user.hostStripeAccount
            ? {
                  accountId: user.hostStripeAccount.stripeAccountId,
                  status: user.hostStripeAccount.status,
                  verifiedAt: user.hostStripeAccount.verifiedAt,
              }
            : null,
    };
};

export const userServices = {
    getAllUsersService,
    getSingleUserService,
    updateUserProfileService,
    getMySubscriptionsService,
    activateFreeTierService,
    // stripe
    connectStripeAccountService,
    getStripeAccountStatusService,
    getStripeDashboardService,
    disconnectStripeAccountService,

    // my profile
    getMyProfileService,
};
