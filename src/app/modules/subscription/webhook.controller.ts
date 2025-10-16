import { Request, Response } from "express";
import httpStatus from "http-status";
import { stripeService } from "./stripe.services";
import { subscriptionService } from "../subscription/subscription.services";
import { userSubscriptionService } from "../subscribed/subscribed.services";

// Define custom types for Stripe objects
interface StripeSubscription {
    id: string;
    customer: string;
    status: string;
    metadata: {
        userId?: string;
        type?: string;
        level?: string;
        subscriptionPlanId?: string;
        realUserId?: string;
    };
    current_period_start?: number;
    current_period_end?: number;
    cancel_at_period_end: boolean;
    latest_invoice?: string;
    items: {
        data: Array<{
            price: {
                id: string;
                unit_amount?: number;
                currency: string;
                product?: string;
            };
        }>;
    };
}

interface StripeCheckoutSession {
    id: string;
    customer: string | null;
    customer_details?: {
        email?: string;
        name?: string;
    };
    mode: string;
    subscription?: string;
    metadata: {
        userId?: string;
        type?: string;
        level?: string;
        subscriptionPlanId?: string;
        realUserId?: string;
    };
}

// Helper function to safely create dates from Stripe timestamps
const createSafeDate = (timestamp: number | undefined, fallbackMessage: string): Date => {
    if (!timestamp || timestamp <= 0) {
        console.warn(`⚠️ ${fallbackMessage}: Invalid timestamp ${timestamp}, using current date`);
        return new Date();
    }

    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
        console.warn(`⚠️ ${fallbackMessage}: Invalid date from timestamp ${timestamp}, using current date`);
        return new Date();
    }

    return date;
};

// Helper to find subscription by Stripe price ID
const findSubscriptionByStripePriceId = async (stripePriceId: string) => {
    try {
        return await subscriptionService.getSubscriptionByStripePriceId(stripePriceId);
    } catch (error) {
        console.error("❌ Error finding subscription by price ID:", error);
        return null;
    }
};

// Helper function to attempt creating missing subscription
const attemptToCreateMissingSubscription = async (subscription: StripeSubscription) => {
    try {
        console.log("🔄 Attempting to create missing subscription for:", subscription.id);

        const metadata = subscription.metadata || {};
        const realUserId = metadata.realUserId || metadata.userId;
        const priceId = subscription.items.data[0]?.price.id;

        if (!realUserId || !priceId) {
            console.error("❌ Missing required data for creating missing subscription");
            return null;
        }

        const subscriptionPlan = await findSubscriptionByStripePriceId(priceId);
        if (!subscriptionPlan || !subscriptionPlan._id) {
            console.error("❌ No subscription plan found for price ID:", priceId);
            return null;
        }

        // Use your existing date calculation system
        let currentPeriodStart: Date;
        let currentPeriodEnd: Date;

        const startTimestamp = subscription.current_period_start;
        currentPeriodStart = createSafeDate(startTimestamp, "period_start");

        // Your existing date calculation system
        currentPeriodEnd = new Date(currentPeriodStart);
        if (subscriptionPlan.billingPeriod === "annual") {
            currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
            console.log("✅ Added 1 year for annual plan");
        } else {
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            console.log("✅ Added 1 month for monthly plan");
        }

        const isFreeTier = stripeService.isFreeTier(subscriptionPlan.paymentLink);

        const userSubscriptionData = {
            userId: realUserId,
            subscriptionId: subscriptionPlan._id.toString(),
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer,
            stripePriceId: priceId,
            status: subscription.status as any,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            isFreeTier,
        };

        console.log("📦 Creating missing user subscription with data:", userSubscriptionData);

        const result = await userSubscriptionService.createUserSubscription(userSubscriptionData);
        console.log("✅ Missing user subscription created successfully:", result._id);
        return result;
    } catch (error) {
        console.error("❌ Error creating missing subscription:", error);
        return null;
    }
};

const handleWebhook = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
        return res.status(httpStatus.BAD_REQUEST).send({
            error: "Missing stripe signature",
        });
    }

    try {
        const event = await stripeService.handleWebhookEvent(req.body, signature);
        console.log(`🔔 Processing event: ${event.type}`);

        // Handle different webhook events
        switch (event.type) {
            case "checkout.session.completed":
                const session = event.data.object as unknown as StripeCheckoutSession;
                console.log("🛒 Checkout session completed:", session.id);
                console.log("📋 Session metadata:", session.metadata);

                if (session.mode === "subscription" && session.subscription) {
                    console.log("✅ Subscription checkout completed");
                }
                break;

            case "customer.subscription.created":
                const subscription = event.data.object as unknown as StripeSubscription;
                console.log("📝 Subscription created:", subscription.id);
                console.log("🔍 Subscription metadata:", subscription.metadata);

                try {
                    // Extract and validate metadata
                    const metadata = subscription.metadata || {};
                    console.log("📋 Subscription metadata:", metadata);

                    // Use realUserId if available, otherwise use userId
                    const realUserId = metadata.realUserId || metadata.userId;

                    if (!realUserId) {
                        console.error("❌ No valid user ID found in metadata");
                        break;
                    }

                    // Get price ID from subscription
                    const priceId = subscription.items.data[0]?.price.id;
                    if (!priceId) {
                        console.error("❌ No price ID found in subscription");
                        break;
                    }

                    // Find the subscription plan in our database
                    const subscriptionPlan = await findSubscriptionByStripePriceId(priceId);
                    if (!subscriptionPlan || !subscriptionPlan._id) {
                        console.error("❌ No subscription plan found for price ID:", priceId);
                        break;
                    }

                    console.log("✅ Found subscription plan:", subscriptionPlan._id);

                    // Check if user subscription already exists
                    const existingUserSubscription = await userSubscriptionService.getUserSubscriptionByStripeId(subscription.id);
                    if (existingUserSubscription) {
                        console.log("ℹ️ User subscription already exists, updating...");
                        break;
                    }

                    // Create dates with your existing calculation system
                    let currentPeriodStart: Date;
                    let currentPeriodEnd: Date;

                    // Use available timestamp or current date
                    const startTimestamp = subscription.current_period_start;
                    currentPeriodStart = createSafeDate(startTimestamp, "period_start");

                    // Your existing date calculation system
                    currentPeriodEnd = new Date(currentPeriodStart);
                    if (subscriptionPlan.billingPeriod === "annual") {
                        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
                        console.log("✅ Added 1 year for annual plan");
                    } else {
                        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
                        console.log("✅ Added 1 month for monthly plan");
                    }

                    console.log("✅ Validated dates - Start:", currentPeriodStart, "End:", currentPeriodEnd);

                    // Check if it's a free tier
                    const isFreeTier = stripeService.isFreeTier(subscriptionPlan.paymentLink);

                    // Create new user subscription
                    const userSubscriptionData = {
                        userId: realUserId,
                        subscriptionId: subscriptionPlan._id.toString(),
                        stripeSubscriptionId: subscription.id,
                        stripeCustomerId: subscription.customer,
                        stripePriceId: priceId,
                        status: subscription.status as any,
                        currentPeriodStart,
                        currentPeriodEnd,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                        isFreeTier,
                    };

                    console.log("📦 Creating user subscription with data:", userSubscriptionData);

                    const result = await userSubscriptionService.createUserSubscription(userSubscriptionData);
                    console.log("✅ User subscription created successfully:", result._id);
                } catch (createError) {
                    console.error("❌ Error creating user subscription:", createError);
                }
                break;

            case "customer.subscription.trial_will_end":
                const trialEndingSubscription = event.data.object as unknown as StripeSubscription;
                console.log("⏰ Trial ending soon:", trialEndingSubscription.id);

                try {
                    // Update status to "active" or keep as "trialing" based on your business logic
                    // Since trial is ending, we can set it to "active" or maintain current status
                    await userSubscriptionService.updateUserSubscriptionByStripeId(trialEndingSubscription.id, {
                        status: "active", // or keep the current status if you prefer
                    });
                    console.log("✅ Trial ending - subscription status updated to active");
                } catch (trialError) {
                    console.error("❌ Error handling trial end:", trialError);
                }
                break;
            case "customer.subscription.updated":
                const updatedSubscription = event.data.object as unknown as StripeSubscription;
                console.log("🔄 Subscription updated:", updatedSubscription.id);

                try {
                    const updateData: any = {
                        status: updatedSubscription.status as any,
                        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
                    };

                    // Always update period dates if available
                    if (updatedSubscription.current_period_start) {
                        updateData.currentPeriodStart = createSafeDate(updatedSubscription.current_period_start, "updated current_period_start");
                    }

                    if (updatedSubscription.current_period_end) {
                        updateData.currentPeriodEnd = createSafeDate(updatedSubscription.current_period_end, "updated current_period_end");
                    }

                    // Handle subscription resumption
                    if (updatedSubscription.status === "active" && updatedSubscription.cancel_at_period_end === false) {
                        updateData.status = "active";
                        console.log("✅ Subscription resumed/reactivated");
                    }

                    const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(updatedSubscription.id, updateData);

                    if (updatedUserSubscription) {
                        console.log("✅ User subscription updated successfully");
                    } else {
                        console.warn("⚠️ No user subscription found for Stripe ID:", updatedSubscription.id);

                        // Try to create if not found (edge case)
                        await attemptToCreateMissingSubscription(updatedSubscription);
                    }
                } catch (updateError) {
                    console.error("❌ Error updating user subscription:", updateError);
                }
                break;

            case "customer.subscription.deleted":
                const deletedSubscription = event.data.object as unknown as StripeSubscription;
                console.log("🗑️ Subscription deleted:", deletedSubscription.id);

                try {
                    const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(deletedSubscription.id, { status: "canceled" });

                    if (updatedUserSubscription) {
                        console.log("✅ User subscription marked as canceled");
                    } else {
                        console.warn("⚠️ No user subscription found for Stripe ID:", deletedSubscription.id);
                    }
                } catch (deleteError) {
                    console.error("❌ Error canceling user subscription:", deleteError);
                }
                break;

            case "invoice.payment_succeeded":
                const invoice = event.data.object as any;
                console.log("✅ Payment succeeded:", invoice.id);

                try {
                    if (invoice.subscription) {
                        const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(invoice.subscription, { status: "active" });

                        if (updatedUserSubscription) {
                            console.log("✅ User subscription status updated to active");
                        } else {
                            console.warn("⚠️ No user subscription found for subscription:", invoice.subscription);
                        }
                    }
                } catch (invoiceError) {
                    console.error("❌ Error processing invoice payment:", invoiceError);
                }
                break;

            case "invoice.payment_failed":
                const failedInvoice = event.data.object as any;
                console.log("❌ Payment failed:", failedInvoice.id);

                try {
                    if (failedInvoice.subscription) {
                        const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(failedInvoice.subscription, { status: "past_due" });

                        if (updatedUserSubscription) {
                            console.log("✅ User subscription status updated to past_due");
                        } else {
                            console.warn("⚠️ No user subscription found for subscription:", failedInvoice.subscription);
                        }
                    }
                } catch (failedInvoiceError) {
                    console.error("❌ Error processing failed invoice:", failedInvoiceError);
                }
                break;

            default:
                console.log(`🔔 Unhandled event type: ${event.type}`);
        }

        // Send immediate response for webhooks
        res.status(httpStatus.OK).send({ received: true });
    } catch (error: any) {
        console.error("💥 Webhook processing error:", error);

        res.status(httpStatus.BAD_REQUEST).send({
            error: "Webhook processing failed",
            details: error.message,
        });
    }
};

export const webhookController = {
    handleWebhook,
};
