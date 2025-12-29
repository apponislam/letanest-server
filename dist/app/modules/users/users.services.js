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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userServices = void 0;
const mongoose_1 = require("mongoose");
const auth_interface_1 = require("../auth/auth.interface");
const auth_model_1 = require("../auth/auth.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const subscription_model_1 = require("../subscription/subscription.model");
const stripe_services_1 = require("../subscription/stripe.services");
const config_1 = __importDefault(require("../../config"));
const getAllUsersService = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search, role, isActive } = query;
    const filter = {
        isActive: true,
    };
    if (search) {
        filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
    }
    if (role)
        filter.role = role;
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = yield Promise.all([auth_model_1.UserModel.find(filter).select("-password").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), auth_model_1.UserModel.countDocuments(filter)]);
    return {
        users,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
        },
    };
});
const getSingleUserService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield auth_model_1.UserModel.findById(id).select("-password");
});
const updateUserProfileService = (userId, updateData, profileImg) => __awaiter(void 0, void 0, void 0, function* () {
    let fullName = updateData.firstName;
    if (updateData.lastName && updateData.lastName.trim() !== "") {
        fullName = `${updateData.firstName} ${updateData.lastName}`;
    }
    const updateFields = {
        name: fullName.trim(), // Trim to remove any accidental spaces
        phone: updateData.phone,
        address: updateData.address,
        gender: updateData.gender,
    };
    if (profileImg) {
        updateFields.profileImg = `/uploads/profile/${profileImg.filename}`;
    }
    return yield auth_model_1.UserModel.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true }).select("-password");
});
const getMySubscriptionsService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId)
        .select("name email role profileImg subscriptions freeTireUsed freeTireExpiry")
        .populate({
        path: "subscriptions.subscription",
        model: "UserSubscription",
    })
        .populate({
        path: "currentSubscription",
        model: "UserSubscription",
    })
        .populate({
        path: "freeTireSub",
        model: "Subscription",
        select: "billingPeriod bookingFee level paymentLink type freeBookings listingLimit commission",
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    return user;
});
const activateFreeTierService = (userId, subscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    // Calculate expiry date (30 days from now for free tier)
    const freeTireExpiry = new Date();
    freeTireExpiry.setDate(freeTireExpiry.getDate() + 30);
    // Fetch subscription to get free tier data
    const subscription = yield subscription_model_1.Subscription.findById(subscriptionId).lean();
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
    const updatedUser = yield auth_model_1.UserModel.findByIdAndUpdate(userId, {
        freeTireUsed: true,
        freeTireExpiry,
        freeTireSub: new mongoose_1.Types.ObjectId(subscriptionId),
        freeTireData, // save the optional numeric data
    }, { new: true }).populate("freeTireSub");
    return {
        freeTireUsed: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.freeTireUsed,
        freeTireExpiry: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.freeTireExpiry,
        freeTireSub: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.freeTireSub,
        freeTireData: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.freeTireData,
    };
});
// Stripe Account connect
/**
 * Connect host to Stripe
 */
const connectStripeAccountService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Check if user is a host
    // if (user.role !== "HOST") {
    //     throw new ApiError(httpStatus.BAD_REQUEST, "Only hosts can connect Stripe accounts");
    // }
    // Check if already has Stripe account
    if (user.hostStripeAccount && user.hostStripeAccount.status === "verified") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Stripe account already connected");
    }
    // Create Stripe Connect account
    const account = yield stripe_services_1.stripeService.createConnectAccount(userId, user.email, user.name);
    // Create account link for onboarding
    const accountLink = yield stripe_services_1.stripeService.createAccountLink(account.id, userId);
    // Save Stripe account ID to user (pending status)
    user.hostStripeAccount = {
        stripeAccountId: account.id,
        status: "pending",
        createdAt: new Date(),
    };
    yield user.save();
    return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
        status: "pending",
    };
});
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
const getStripeAccountStatusService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user || !user.hostStripeAccount) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Stripe account not found");
    }
    const stripeStatus = yield stripe_services_1.stripeService.getConnectAccountStatus(user.hostStripeAccount.stripeAccountId);
    let appStatus;
    if (stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled) {
        appStatus = "verified";
    }
    else if (config_1.default.node_env === "development" && stripeStatus.chargesEnabled) {
        appStatus = "verified";
    }
    else if (stripeStatus.detailsSubmitted && !stripeStatus.chargesEnabled) {
        appStatus = "rejected";
    }
    else {
        appStatus = "pending";
    }
    if (appStatus !== user.hostStripeAccount.status) {
        user.hostStripeAccount.status = appStatus;
        if (appStatus === "verified") {
            user.hostStripeAccount.verifiedAt = new Date();
        }
        yield user.save();
    }
    return {
        status: user.hostStripeAccount.status,
        stripeStatus: stripeStatus,
        accountId: user.hostStripeAccount.stripeAccountId,
    };
});
/**
 * Get Stripe dashboard link
 */
const getStripeDashboardService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user || !user.hostStripeAccount) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Stripe account not found");
    }
    const loginLink = yield stripe_services_1.stripeService.createLoginLink(user.hostStripeAccount.stripeAccountId);
    return {
        dashboardUrl: loginLink.url,
    };
});
/**
 * Disconnect Stripe account
 */
const disconnectStripeAccountService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user || !user.hostStripeAccount) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Stripe account not found");
    }
    // Remove Stripe account from user
    user.hostStripeAccount = undefined;
    yield user.save();
    return {
        success: true,
        message: "Stripe account disconnected successfully",
    };
});
const getMyProfileService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId)
        .select("-password")
        .populate({
        path: "subscriptions.subscription",
        model: "UserSubscription",
        // Remove the nested populate since UserSubscription should have the badge directly
    })
        .populate({
        path: "currentSubscription",
        model: "UserSubscription",
        populate: {
            path: "subscription",
            model: "Subscription",
            select: "name badge level type price",
        },
    })
        .populate({
        path: "freeTireSub",
        model: "Subscription",
        select: "name badge billingPeriod bookingFee level paymentLink type freeBookings listingLimit commission",
    })
        .lean();
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
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
            isVerifiedByAdmin: user.isVerifiedByAdmin,
        },
        subscriptions: {
            activeSubscriptions: user.subscriptions,
            currentSubscription: user.currentSubscription,
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
        stripeCustomerId: user.stripeCustomerId, // Add stripe customer ID
    };
});
const getRandomAdminService = () => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield auth_model_1.UserModel.aggregate([{ $match: { role: "ADMIN", isActive: true } }, { $sample: { size: 1 } }, { $project: { _id: 1, name: 1, email: 1, phone: 1, profileImg: 1, role: 1 } }]);
    return admin.length > 0 ? admin[0] : null;
});
const changeUserRoleService = (userId, newRole, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    if (!Object.values(auth_interface_1.roles).includes(newRole)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid role");
    }
    if (user.role === newRole) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `User is already a ${newRole}`);
    }
    user.role = newRole;
    yield user.save();
    const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return userWithoutPassword;
});
const deleteUserService = (userId, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Check if user is already inactive
    if (!user.isActive) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "User is already deleted");
    }
    // Prevent admin from deleting themselves
    if (userId === adminId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Cannot delete your own account");
    }
    // Soft delete by setting isActive to false
    user.isActive = false;
    yield user.save();
    const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return userWithoutPassword;
});
exports.userServices = {
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
    // random admin
    getRandomAdminService,
    //change user role
    changeUserRoleService,
    //delete user
    deleteUserService,
};
