import Stripe from "stripe";
import config from "../../config";

const stripe = new Stripe(config.stripe_secret_key!, {
    apiVersion: "2025-09-30.clover",
});

export interface CreateProductData {
    name: string;
    description: string;
    type: "GUEST" | "HOST";
    level: string;
    cost: number;
    currency: string;
    billingPeriod: "monthly" | "annual" | "none";
}

export interface StripeProductResponse {
    stripeProductId: string;
    stripePriceId: string;
    paymentLink: string;
}

export class StripeService {
    // Create subscription product in Stripe
    async createSubscriptionProduct(data: CreateProductData): Promise<StripeProductResponse> {
        try {
            // 1. Create product in Stripe
            const product = await stripe.products.create({
                name: data.name,
                description: data.description,
                metadata: {
                    type: data.type,
                    level: data.level,
                    billingPeriod: data.billingPeriod,
                },
            });

            let price: Stripe.Price | null = null;
            let paymentLink: Stripe.PaymentLink | null = null;

            // 2. Create price only if it's a paid subscription
            if (data.cost > 0 && data.billingPeriod !== "none") {
                price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: Math.round(data.cost * 100), // Convert to cents/pence
                    currency: data.currency.toLowerCase(),
                    recurring: {
                        interval: data.billingPeriod === "monthly" ? "month" : "year",
                        interval_count: 1,
                    },
                });

                // 3. Create payment link for paid subscriptions
                paymentLink = await stripe.paymentLinks.create({
                    line_items: [
                        {
                            price: price.id,
                            quantity: 1,
                        },
                    ],
                    metadata: {
                        productId: product.id,
                        type: data.type,
                        level: data.level,
                    },
                    after_completion: {
                        type: "redirect",
                        redirect: {
                            url: `${config.client_url}/payment/success`,
                        },
                    },
                });
            }

            return {
                stripeProductId: product.id,
                stripePriceId: price?.id || "free_tier",
                paymentLink: paymentLink?.url || "free_tier",
            };
        } catch (error) {
            console.error("Stripe product creation failed:", error);
            throw new Error("Failed to create Stripe product");
        }
    }

    // Update subscription product
    async updateSubscriptionProduct(stripeProductId: string, data: Partial<CreateProductData>): Promise<void> {
        try {
            // Build metadata object without undefined values
            const metadata: Record<string, string> = {};

            if (data.type) metadata.type = data.type;
            if (data.level) metadata.level = data.level;
            if (data.billingPeriod) metadata.billingPeriod = data.billingPeriod;

            await stripe.products.update(stripeProductId, {
                name: data.name,
                description: data.description,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            });

            // Note: Cannot update price - must create new price and archive old one
        } catch (error) {
            console.error("Stripe product update failed:", error);
            throw new Error("Failed to update Stripe product");
        }
    }

    // Archive/delete subscription product
    async archiveSubscriptionProduct(stripeProductId: string): Promise<void> {
        try {
            await stripe.products.update(stripeProductId, {
                active: false,
            });
        } catch (error) {
            console.error("Stripe product archiving failed:", error);
            throw new Error("Failed to archive Stripe product");
        }
    }

    // Create checkout session for one-time payments
    async createCheckoutSession(priceId: string, customerId?: string) {
        try {
            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                payment_method_types: ["card"],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                customer: customerId,
                success_url: `${config.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${config.client_url}/payment/cancel`,
            });

            return session;
        } catch (error) {
            console.error("Checkout session creation failed:", error);
            throw new Error("Failed to create checkout session");
        }
    }

    // Handle webhook events
    async handleWebhookEvent(payload: Buffer, signature: string) {
        try {
            const event = stripe.webhooks.constructEvent(payload, signature, config.stripe_webhook_secret!);

            return event;
        } catch (error) {
            console.error("Webhook signature verification failed:", error);
            throw new Error("Invalid webhook signature");
        }
    }

    // Get subscription details
    async getSubscription(subscriptionId: string) {
        try {
            return await stripe.subscriptions.retrieve(subscriptionId);
        } catch (error) {
            console.error("Failed to retrieve subscription:", error);
            throw new Error("Failed to get subscription details");
        }
    }

    // Cancel subscription
    async cancelSubscription(subscriptionId: string) {
        try {
            return await stripe.subscriptions.cancel(subscriptionId);
        } catch (error) {
            console.error("Failed to cancel subscription:", error);
            throw new Error("Failed to cancel subscription");
        }
    }
}

export const stripeService = new StripeService();
