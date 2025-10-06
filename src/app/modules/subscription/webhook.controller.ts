// controllers/webhook.controller.ts
import { Request, Response } from "express";

import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { stripeService } from "./stripe.services";

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Missing stripe signature",
            data: null,
        });
    }

    try {
        const event = await stripeService.handleWebhookEvent(req.body, signature);

        // Handle different webhook events
        switch (event.type) {
            case "customer.subscription.created":
                // Handle new subscription
                console.log("Subscription created:", event.data.object);
                break;

            case "customer.subscription.updated":
                // Handle subscription update
                console.log("Subscription updated:", event.data.object);
                break;

            case "customer.subscription.deleted":
                // Handle subscription cancellation
                console.log("Subscription deleted:", event.data.object);
                break;

            case "invoice.payment_succeeded":
                // Handle successful payment
                console.log("Payment succeeded:", event.data.object);
                break;

            case "invoice.payment_failed":
                // Handle failed payment
                console.log("Payment failed:", event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Webhook processed successfully",
            data: null,
        });
    } catch (error) {
        console.error("Webhook error:", error);
        sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Webhook signature verification failed",
            data: null,
        });
    }
});

export const webhookController = {
    handleWebhook,
};
