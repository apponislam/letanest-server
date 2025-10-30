import { Request, Response, NextFunction } from "express";
import { UserModel } from "../auth/auth.model";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import ApiError from "../../../errors/ApiError";
import { PropertyModel } from "./properties.model";
import { UserSubscription } from "../subscribed/subscribed.model";

export const checkPropertyListingLimit = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const user = await UserModel.findById(userId).populate("freeTireSub").populate("currentSubscription");

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const currentPropertyCount = await PropertyModel.countDocuments({
        createdBy: userId,
        isDeleted: false,
        status: { $in: ["pending", "published"] },
    });

    if (user.role === "ADMIN") {
        return next();
    }

    // Check if user has free trial with listing limit
    if (user.freeTireData && (user.freeTireData.listingLimit || 0) > 0) {
        const listingLimit = user.freeTireData.listingLimit || 0;

        if (currentPropertyCount >= listingLimit) {
            throw new ApiError(httpStatus.FORBIDDEN, `You have reached your free trial listing limit of ${listingLimit} properties. Please upgrade your subscription to list more properties.`);
        }

        console.log("Free trial active - allowing property creation");
        return next();
    }

    // Check current subscription
    if (user.currentSubscription) {
        const userSubscription = await UserSubscription.findById(user.currentSubscription).populate("subscription");

        if (userSubscription && userSubscription.status === "active") {
            const subscription = userSubscription.subscription as any;
            const listingLimit = subscription.listingLimit || 0;

            if (listingLimit > 0 && currentPropertyCount >= listingLimit) {
                throw new ApiError(httpStatus.FORBIDDEN, `You have reached your subscription listing limit of ${listingLimit} properties. Please upgrade your plan to list more properties.`);
            }

            console.log("Active subscription - allowing property creation");
            return next();
        } else {
            throw new ApiError(httpStatus.FORBIDDEN, "Your subscription is not active. Please subscribe to a plan to list properties.");
        }
    }

    // If we reach here, user has no free trial or subscription
    throw new ApiError(httpStatus.FORBIDDEN, "You are not subscribed to any plan. Please choose a subscription plan to list properties.");
});
