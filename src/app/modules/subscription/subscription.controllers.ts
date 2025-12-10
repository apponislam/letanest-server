import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { subscriptionService } from "./subscription.services";
import ApiError from "../../../errors/ApiError";
import { stripeService } from "./stripe.services";

const createSubscription = catchAsync(async (req: Request, res: Response) => {
    console.log(req.body);
    const subscription = await subscriptionService.createSubscription(req.body);
    console.log("Created Subscription:", subscription);

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

const getAllSubscriptionsAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await subscriptionService.getAllSubscriptionsAdmin(req.query);

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

const getSubscriptionsByTypeForAdmin = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.params;

    if (type !== "GUEST" && type !== "HOST") {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Invalid subscription type",
            data: null,
        });
    }

    const subscriptions = await subscriptionService.getSubscriptionsByTypeForAdmin(type);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${type} subscriptions retrieved successfully`,
        data: subscriptions,
    });
});

const getSubscriptionByTypeAndLevel = catchAsync(async (req: Request, res: Response) => {
    const { type, level } = req.params;

    if (type !== "GUEST" && type !== "HOST") {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Invalid subscription type",
            data: null,
        });
    }

    if (!["free", "premium", "gold"].includes(level)) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Invalid subscription level",
            data: null,
        });
    }

    const subscription = await subscriptionService.getActiveSubscriptionsByTypeAndLevel(type as "GUEST" | "HOST", level as "free" | "premium" | "gold");

    sendResponse(res, {
        statusCode: subscription ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Subscription retrieved successfully" : "Subscription not found",
        data: subscription,
    });
});

const getDefaultSubscription = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.params;

    if (type !== "GUEST" && type !== "HOST") {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Invalid subscription type",
            data: null,
        });
    }

    const subscription = await subscriptionService.getDefaultSubscription(type as "GUEST" | "HOST");

    sendResponse(res, {
        statusCode: subscription ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Default subscription retrieved successfully" : "Default subscription not found",
        data: subscription,
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

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
    const { subscriptionId } = req.body;

    // Get user from auth middleware
    const user = req.user;

    // Get subscription details
    const subscription = await subscriptionService.getSubscriptionById(subscriptionId);
    if (!subscription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");
    }

    if (!subscription.isActive) {
        throw new ApiError(httpStatus.BAD_REQUEST, "This subscription is not active");
    }

    // Create checkout session with user data
    const session = await stripeService.createCheckoutSessionWithUser(
        subscription.stripePriceId,
        {
            userId: user._id.toString(),
            subscriptionPlanId: subscriptionId,
            type: subscription.type,
            level: subscription.level,
            userEmail: user.email,
            userName: user.name || user.email,
        },
        user.stripeCustomerId
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Checkout session created successfully",
        data: { url: session.url },
    });
});

const getCheckoutSession = catchAsync(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    if (!sessionId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Session ID is required");
    }

    const session = await stripeService.getCheckoutSession(sessionId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Checkout session retrieved successfully",
        data: session,
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

export const subscriptionController = {
    createSubscription,
    getAllSubscriptions,
    getAllSubscriptionsAdmin,
    getSubscription,
    getSubscriptionsByType,
    getSubscriptionsByTypeForAdmin,
    getSubscriptionByTypeAndLevel,
    getDefaultSubscription,
    updateSubscription,
    toggleSubscriptionStatus,
    createCheckoutSession,
    getCheckoutSession,

    // delete route
    deleteSubscription,
};
