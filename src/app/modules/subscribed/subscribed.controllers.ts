import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { userSubscriptionService } from "./subscribed.services";
import ApiError from "../../../errors/ApiError";

const createUserSubscription = catchAsync(async (req: Request, res: Response) => {
    const userSubscription = await userSubscriptionService.createUserSubscription({
        ...req.body,
        userId: req.user?.userId, // From auth middleware
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Subscription activated successfully",
        data: userSubscription,
    });
});

const getMySubscriptions = catchAsync(async (req: Request, res: Response) => {
    const subscriptions = await userSubscriptionService.getUserSubscriptions(req.user?.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscriptions retrieved successfully",
        data: subscriptions,
    });
});

const getMyActiveSubscription = catchAsync(async (req: Request, res: Response) => {
    const subscription = await userSubscriptionService.getActiveUserSubscription(req.user?.userId);

    sendResponse(res, {
        statusCode: subscription ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Active subscription retrieved successfully" : "No active subscription found",
        data: subscription || null,
    });
});

const getUserSubscription = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subscription = await userSubscriptionService.getUserSubscriptionById(id);

    sendResponse(res, {
        statusCode: subscription ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Subscription retrieved successfully" : "Subscription not found",
        data: subscription || null,
    });
});

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const subscription = await userSubscriptionService.cancelUserSubscription(id, userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription cancelled successfully",
        data: subscription,
    });
});

const updateSubscriptionStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const subscription = await userSubscriptionService.updateUserSubscriptionStatus(id, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription status updated successfully",
        data: subscription,
    });
});

// const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
//     const { event } = req.body;

//     let updatedSubscription;

//     switch (event.type) {
//         case "customer.subscription.updated":
//         case "customer.subscription.created":
//             updatedSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(event.data.object.id, {
//                 status: event.data.object.status,
//                 currentPeriodStart: new Date(event.data.object.current_period_start * 1000),
//                 currentPeriodEnd: new Date(event.data.object.current_period_end * 1000),
//                 cancelAtPeriodEnd: event.data.object.cancel_at_period_end,
//             });
//             break;

//         case "customer.subscription.deleted":
//             updatedSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(event.data.object.id, { status: "canceled" });
//             break;
//     }

//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Webhook processed successfully",
//         data: updatedSubscription,
//     });
// });

export const userSubscriptionController = {
    createUserSubscription,
    getMySubscriptions,
    getMyActiveSubscription,
    getUserSubscription,
    cancelSubscription,
    updateSubscriptionStatus,
    // handleStripeWebhook,
};
