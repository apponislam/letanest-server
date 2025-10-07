// import { Request, Response } from "express";
// import httpStatus from "http-status";
// import { stripeService } from "./stripe.services";
// import { subscriptionService } from "../subscription/subscription.services";
// import { userSubscriptionService } from "../subscribed/subscribed.services";

// // Define custom types for Stripe objects
// interface StripeSubscription {
//     id: string;
//     customer: string;
//     status: string;
//     metadata: {
//         userId?: string;
//         type?: string;
//         level?: string;
//         subscriptionPlanId?: string;
//         realUserId?: string;
//     };
//     current_period_start?: number;
//     current_period_end?: number;
//     cancel_at_period_end: boolean;
//     latest_invoice?: string;
//     items: {
//         data: Array<{
//             price: {
//                 id: string;
//                 unit_amount?: number;
//                 currency: string;
//                 product?: string;
//             };
//         }>;
//     };
// }

// interface StripeCheckoutSession {
//     id: string;
//     customer: string | null;
//     customer_details?: {
//         email?: string;
//         name?: string;
//     };
//     mode: string;
//     subscription?: string;
//     metadata: {
//         userId?: string;
//         type?: string;
//         level?: string;
//         subscriptionPlanId?: string;
//         realUserId?: string;
//     };
//     subscription_details?: {
//         metadata?: {
//             userId?: string;
//             type?: string;
//             level?: string;
//             subscriptionPlanId?: string;
//             realUserId?: string;
//         };
//     };
// }

// // Helper function to safely create dates from Stripe timestamps
// const createSafeDate = (timestamp: number, fallbackMessage: string): Date => {
//     if (!timestamp || timestamp <= 0) {
//         console.warn(`⚠️ ${fallbackMessage}: Invalid timestamp ${timestamp}, using current date`);
//         return new Date();
//     }

//     const date = new Date(timestamp * 1000);
//     if (isNaN(date.getTime())) {
//         console.warn(`⚠️ ${fallbackMessage}: Invalid date from timestamp ${timestamp}, using current date`);
//         return new Date();
//     }

//     return date;
// };

// // Helper to extract metadata from different sources
// const extractMetadata = (event: any) => {
//     let metadata: any = {};

//     // Try to get metadata from checkout session first
//     if (event.data?.object?.metadata) {
//         metadata = { ...event.data.object.metadata };
//     }

//     // Try to get metadata from subscription
//     if (event.data?.object?.subscription_details?.metadata) {
//         metadata = { ...metadata, ...event.data.object.subscription_details.metadata };
//     }

//     console.log("🔍 Extracted metadata:", metadata);
//     return metadata;
// };

// // Helper to find subscription by Stripe price ID
// const findSubscriptionByStripePriceId = async (stripePriceId: string) => {
//     try {
//         return await subscriptionService.getSubscriptionByStripePriceId(stripePriceId);
//     } catch (error) {
//         console.error("❌ Error finding subscription by price ID:", error);
//         return null;
//     }
// };

// // Helper to find subscription by Stripe product ID
// const findSubscriptionByStripeProductId = async (stripeProductId: string) => {
//     try {
//         return await subscriptionService.getSubscriptionByStripeProductId(stripeProductId);
//     } catch (error) {
//         console.error("❌ Error finding subscription by product ID:", error);
//         return null;
//     }
// };

// const handleWebhook = async (req: Request, res: Response) => {
//     const signature = req.headers["stripe-signature"] as string;

//     if (!signature) {
//         return res.status(httpStatus.BAD_REQUEST).send({
//             error: "Missing stripe signature",
//         });
//     }

//     try {
//         const event = await stripeService.handleWebhookEvent(req.body, signature);
//         console.log(`🔔 Processing event: ${event.type}`);
//         console.log("📦 Full event object:", JSON.stringify(event, null, 2));

//         // Handle different webhook events
//         switch (event.type) {
//             case "checkout.session.completed":
//                 const session = event.data.object as unknown as StripeCheckoutSession;
//                 console.log("🛒 Checkout session completed:", session.id);
//                 console.log("📋 Session metadata:", session.metadata);
//                 console.log("👤 Customer:", session.customer);
//                 console.log("💳 Mode:", session.mode);

//                 if (session.mode === "subscription" && session.subscription) {
//                     console.log("✅ Subscription checkout completed");

//                     // Get subscription details from Stripe
//                     const stripeSubscription = await stripeService.getSubscription(session.subscription);
//                     console.log("📝 Stripe subscription details:", stripeSubscription);

//                     if (stripeSubscription) {
//                         const subscription = stripeSubscription as unknown as StripeSubscription;

//                         // Extract and validate metadata
//                         const metadata = subscription.metadata || session.metadata || {};
//                         console.log("📋 Combined metadata:", metadata);

//                         // Use realUserId if available, otherwise use userId
//                         const realUserId = metadata.realUserId || metadata.userId;

//                         if (!realUserId) {
//                             console.error("❌ No valid user ID found in metadata");
//                             break;
//                         }

//                         // Get price ID from subscription
//                         const priceId = subscription.items.data[0]?.price.id;
//                         if (!priceId) {
//                             console.error("❌ No price ID found in subscription");
//                             break;
//                         }

//                         // Find the subscription plan in our database
//                         const subscriptionPlan = await findSubscriptionByStripePriceId(priceId);
//                         if (!subscriptionPlan || !subscriptionPlan._id) {
//                             console.error("❌ No subscription plan found for price ID:", priceId);
//                             break;
//                         }

//                         console.log("✅ Found subscription plan:", subscriptionPlan._id);

//                         // Check if user subscription already exists
//                         const existingUserSubscription = await userSubscriptionService.getUserSubscriptionByStripeId(subscription.id);
//                         if (existingUserSubscription) {
//                             console.log("ℹ️ User subscription already exists, updating...");

//                             // Update existing subscription
//                             await userSubscriptionService.updateUserSubscriptionByStripeId(subscription.id, {
//                                 status: subscription.status as any,
//                                 currentPeriodStart: createSafeDate(subscription.current_period_start, "current_period_start"),
//                                 currentPeriodEnd: createSafeDate(subscription.current_period_end, "current_period_end"),
//                                 cancelAtPeriodEnd: subscription.cancel_at_period_end,
//                             });

//                             console.log("✅ Existing user subscription updated");
//                             break;
//                         }

//                         // Create new user subscription
//                         try {
//                             // Safely create dates with validation
//                             const currentPeriodStart = createSafeDate(subscription.current_period_start, "current_period_start");
//                             const currentPeriodEnd = createSafeDate(subscription.current_period_end, "current_period_end");

//                             console.log("✅ Validated dates - Start:", currentPeriodStart, "End:", currentPeriodEnd);

//                             // Check if it's a free tier
//                             const isFreeTier = stripeService.isFreeTier(subscriptionPlan.paymentLink);

//                             const userSubscriptionData = {
//                                 userId: realUserId,
//                                 subscriptionId: subscriptionPlan._id.toString(),
//                                 stripeSubscriptionId: subscription.id,
//                                 stripeCustomerId: subscription.customer,
//                                 stripePriceId: priceId,
//                                 status: subscription.status as any,
//                                 currentPeriodStart,
//                                 currentPeriodEnd,
//                                 cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
//                                 isFreeTier,
//                             };

//                             console.log("📦 Creating user subscription with data:", userSubscriptionData);

//                             const result = await userSubscriptionService.createUserSubscription(userSubscriptionData);
//                             console.log("✅ User subscription created successfully:", result._id);

//                             // Log success details
//                             console.log("🎉 User subscription successfully recorded:", {
//                                 userSubscriptionId: result._id,
//                                 userId: result.user,
//                                 subscriptionId: result.subscription,
//                                 type: subscriptionPlan.type,
//                                 level: subscriptionPlan.level,
//                                 status: result.status,
//                             });
//                         } catch (createError) {
//                             console.error("❌ Error creating user subscription:", createError);
//                             console.error("💥 Subscription data that failed:", {
//                                 subscriptionId: subscription.id,
//                                 metadata: metadata,
//                                 priceId: priceId,
//                             });
//                         }
//                     }
//                 }
//                 break;

//             // In your webhook controller, update the customer.subscription.created case:

//             case "customer.subscription.created":
//                 const subscription = event.data.object as unknown as StripeSubscription;
//                 console.log("📝 Subscription created:", subscription.id);
//                 console.log("🔍 Subscription metadata:", subscription.metadata);

//                 try {
//                     // Extract and validate metadata
//                     const metadata = subscription.metadata || {};
//                     console.log("📋 Subscription metadata:", metadata);

//                     // Use realUserId if available, otherwise use userId
//                     const realUserId = metadata.realUserId || metadata.userId;

//                     if (!realUserId) {
//                         console.error("❌ No valid user ID found in metadata");
//                         break;
//                     }

//                     // Get price ID from subscription
//                     const priceId = subscription.items.data[0]?.price.id;
//                     if (!priceId) {
//                         console.error("❌ No price ID found in subscription");
//                         break;
//                     }

//                     // Find the subscription plan in our database
//                     const subscriptionPlan = await findSubscriptionByStripePriceId(priceId);
//                     if (!subscriptionPlan || !subscriptionPlan._id) {
//                         console.error("❌ No subscription plan found for price ID:", priceId);
//                         break;
//                     }

//                     console.log("✅ Found subscription plan:", subscriptionPlan._id);

//                     // Check if user subscription already exists
//                     const existingUserSubscription = await userSubscriptionService.getUserSubscriptionByStripeId(subscription.id);
//                     if (existingUserSubscription) {
//                         console.log("ℹ️ User subscription already exists, updating...");
//                         break;
//                     }

//                     // FIX 1: Safely create dates with validation - check if timestamps exist
//                     let currentPeriodStart: Date;
//                     let currentPeriodEnd: Date;

//                     if (subscription.current_period_start) {
//                         currentPeriodStart = createSafeDate(subscription.current_period_start, "current_period_start");
//                     } else {
//                         currentPeriodStart = new Date();
//                         console.warn("⚠️ Using current date for period start (timestamp missing)");
//                     }

//                     if (subscription.current_period_end) {
//                         currentPeriodEnd = createSafeDate(subscription.current_period_end, "current_period_end");
//                     } else {
//                         // Set default period end (1 month from now for monthly, 1 year for annual)
//                         currentPeriodEnd = new Date();
//                         if (subscriptionPlan.billingPeriod === "annual") {
//                             currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
//                         } else {
//                             currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
//                         }
//                         console.warn("⚠️ Using calculated date for period end (timestamp missing)");
//                     }

//                     console.log("✅ Validated dates - Start:", currentPeriodStart, "End:", currentPeriodEnd);

//                     // FIX 2: Check if it's a free tier
//                     const isFreeTier = stripeService.isFreeTier(subscriptionPlan.paymentLink);

//                     // FIX 3: Create new user subscription with proper data types
//                     const userSubscriptionData = {
//                         userId: realUserId, // This should be a string that can be cast to ObjectId
//                         subscriptionId: subscriptionPlan._id.toString(), // Convert to string
//                         stripeSubscriptionId: subscription.id,
//                         stripeCustomerId: subscription.customer, // FIX: Use subscription.customer (string) NOT the full customer object
//                         stripePriceId: priceId,
//                         status: subscription.status as any,
//                         currentPeriodStart,
//                         currentPeriodEnd,
//                         cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
//                         isFreeTier,
//                     };

//                     console.log("📦 Creating user subscription with data:", userSubscriptionData);

//                     const result = await userSubscriptionService.createUserSubscription(userSubscriptionData);
//                     console.log("✅ User subscription created successfully:", result._id);
//                 } catch (createError) {
//                     console.error("❌ Error creating user subscription:", createError);
//                     console.error("💥 Subscription data that failed:", {
//                         id: subscription.id,
//                         metadata: subscription.metadata,
//                         current_period_start: subscription.current_period_start,
//                         current_period_end: subscription.current_period_end,
//                         customer: subscription.customer, // This should be the string ID
//                     });
//                 }
//                 break;

//             case "customer.subscription.updated":
//                 const updatedSubscription = event.data.object as unknown as StripeSubscription;
//                 console.log("🔄 Subscription updated:", updatedSubscription.id);

//                 try {
//                     // Update user subscription
//                     const updateData: any = {
//                         status: updatedSubscription.status as any,
//                         cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
//                     };

//                     // Update period dates if available
//                     if (updatedSubscription.current_period_start && updatedSubscription.current_period_end) {
//                         updateData.currentPeriodStart = createSafeDate(updatedSubscription.current_period_start, "updated current_period_start");
//                         updateData.currentPeriodEnd = createSafeDate(updatedSubscription.current_period_end, "updated current_period_end");
//                     }

//                     const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(updatedSubscription.id, updateData);

//                     if (updatedUserSubscription) {
//                         console.log("✅ User subscription updated successfully");
//                     } else {
//                         console.warn("⚠️ No user subscription found for Stripe ID:", updatedSubscription.id);
//                     }
//                 } catch (updateError) {
//                     console.error("❌ Error updating user subscription:", updateError);
//                 }
//                 break;

//             case "customer.subscription.deleted":
//                 const deletedSubscription = event.data.object as unknown as StripeSubscription;
//                 console.log("🗑️ Subscription deleted:", deletedSubscription.id);

//                 try {
//                     // Update user subscription status to canceled
//                     const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(deletedSubscription.id, { status: "canceled" });

//                     if (updatedUserSubscription) {
//                         console.log("✅ User subscription marked as canceled");
//                     } else {
//                         console.warn("⚠️ No user subscription found for Stripe ID:", deletedSubscription.id);
//                     }
//                 } catch (deleteError) {
//                     console.error("❌ Error canceling user subscription:", deleteError);
//                 }
//                 break;

//             case "invoice.payment_succeeded":
//                 const invoice = event.data.object as any;
//                 console.log("✅ Payment succeeded:", invoice.id);

//                 try {
//                     // Update subscription status to active
//                     if (invoice.subscription) {
//                         const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(invoice.subscription, { status: "active" });

//                         if (updatedUserSubscription) {
//                             console.log("✅ User subscription status updated to active");
//                         } else {
//                             console.warn("⚠️ No user subscription found for subscription:", invoice.subscription);
//                         }
//                     }
//                 } catch (invoiceError) {
//                     console.error("❌ Error processing invoice payment:", invoiceError);
//                 }
//                 break;

//             case "invoice.payment_failed":
//                 const failedInvoice = event.data.object as any;
//                 console.log("❌ Payment failed:", failedInvoice.id);

//                 try {
//                     // Update subscription status to past_due
//                     if (failedInvoice.subscription) {
//                         const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(failedInvoice.subscription, { status: "past_due" });

//                         if (updatedUserSubscription) {
//                             console.log("✅ User subscription status updated to past_due");
//                         } else {
//                             console.warn("⚠️ No user subscription found for subscription:", failedInvoice.subscription);
//                         }
//                     }
//                 } catch (failedInvoiceError) {
//                     console.error("❌ Error processing failed invoice:", failedInvoiceError);
//                 }
//                 break;

//             default:
//                 console.log(`🔔 Unhandled event type: ${event.type}`);
//         }

//         // Send immediate response for webhooks
//         res.status(httpStatus.OK).send({ received: true });
//     } catch (error: any) {
//         console.error("💥 Webhook processing error:", error);

//         res.status(httpStatus.BAD_REQUEST).send({
//             error: "Webhook processing failed",
//             details: error.message,
//         });
//     }
// };

// export const webhookController = {
//     handleWebhook,
// };

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

                    // Create dates with proper period calculation
                    let currentPeriodStart: Date;
                    let currentPeriodEnd: Date;

                    // Use available timestamp or current date
                    const startTimestamp = subscription.current_period_start;
                    // const startTimestamp = subscription.current_period_start || subscription.created;
                    currentPeriodStart = createSafeDate(startTimestamp, "period_start");

                    // Calculate end date based on billing period
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

            case "customer.subscription.updated":
                const updatedSubscription = event.data.object as unknown as StripeSubscription;
                console.log("🔄 Subscription updated:", updatedSubscription.id);

                try {
                    const updateData: any = {
                        status: updatedSubscription.status as any,
                        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
                    };

                    // Update period dates if available
                    if (updatedSubscription.current_period_start && updatedSubscription.current_period_end) {
                        updateData.currentPeriodStart = createSafeDate(updatedSubscription.current_period_start, "updated current_period_start");
                        updateData.currentPeriodEnd = createSafeDate(updatedSubscription.current_period_end, "updated current_period_end");
                    }

                    const updatedUserSubscription = await userSubscriptionService.updateUserSubscriptionByStripeId(updatedSubscription.id, updateData);

                    if (updatedUserSubscription) {
                        console.log("✅ User subscription updated successfully");
                    } else {
                        console.warn("⚠️ No user subscription found for Stripe ID:", updatedSubscription.id);
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
