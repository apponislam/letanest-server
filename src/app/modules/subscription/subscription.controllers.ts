import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { subscriptionService } from "./subscription.services";

const createSubscription = catchAsync(async (req: Request, res: Response) => {
    const subscription = await subscriptionService.createSubscription(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Subscription created successfully",
        data: subscription,
    });
});

const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
    const result = await subscriptionService.getAllSubscriptions(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscriptions retrieved successfully",
        data: result.subscriptions,
        meta: result.meta,
    });
});

const getSubscription = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(id);

    sendResponse(res, {
        statusCode: subscription ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Subscription retrieved successfully" : "Subscription not found",
        data: subscription || null,
    });
});

const getSubscriptionsByType = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.params;

    if (type !== "GUEST" && type !== "HOST") {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Invalid subscription type",
            data: null,
        });
    }

    const subscriptions = await subscriptionService.getSubscriptionsByType(type);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${type} subscriptions retrieved successfully`,
        data: subscriptions,
    });
});

const updateSubscription = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subscription = await subscriptionService.updateSubscription(id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription updated successfully",
        data: subscription,
    });
});

const deleteSubscription = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subscription = await subscriptionService.deleteSubscription(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription deleted successfully",
        data: subscription,
    });
});

const toggleSubscriptionStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subscription = await subscriptionService.toggleSubscriptionStatus(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Subscription ${subscription?.isActive ? "activated" : "deactivated"} successfully`,
        data: subscription,
    });
});

export const subscriptionController = {
    createSubscription,
    getAllSubscriptions,
    getSubscription,
    getSubscriptionsByType,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionStatus,
};
