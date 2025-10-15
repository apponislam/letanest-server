import { Types } from "mongoose";
import { IUser } from "../auth/auth.interface";
import { UserModel } from "../auth/auth.model";
import { IUpdateUserProfile } from "./user.interface";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";
import { Subscription } from "../subscription/subscription.model";

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

export const userServices = {
    getAllUsersService,
    getSingleUserService,
    updateUserProfileService,
    getMySubscriptionsService,
    activateFreeTierService,
};
