import Stripe from "stripe";
import config from "../../config";

const stripe = new Stripe(config.stripe_secret_key!, {
    apiVersion: "2025-09-30.clover",
});

export interface CreateProductData {
    name: string;
    description: string;
    type: "GUEST" | "HOST";
    level: "free" | "premium" | "gold";
    cost: number;
    currency: string;
    billingPeriod: "monthly" | "annual" | "none";
}

export interface StripeProductResponse {
    stripeProductId: string;
    stripePriceId: string;
    paymentLink: string;
}

// Interface for checkout session metadata
export interface CheckoutSessionMetadata {
    userId: string; // Real MongoDB user ID
    subscriptionPlanId: string; // Real subscription plan ID from your database
    type: "GUEST" | "HOST";
    level: "free" | "premium" | "gold";
    userEmail?: string;
    userName?: string;
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
                    subscriptionTier: `${data.type}_${data.level}`,
                },
            });

            let price: Stripe.Price | null = null;
            let paymentLink: string;

            // 2. For free tiers, create a one-time price and use simple payment link
            if (data.cost === 0) {
                price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: 0, // Free
                    currency: data.currency.toLowerCase(),
                });

                // 3. For free tiers, use a simple identifier instead of Stripe payment link
                paymentLink = `free-tier-${data.type.toLowerCase()}-${data.level}`;

                console.log(`✅ Free tier created - Type: ${data.type}, Level: ${data.level}`);
            }
            // 4. Create price and payment link for paid subscriptions
            else if (data.cost > 0 && data.billingPeriod !== "none") {
                price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: Math.round(data.cost * 100), // Convert to cents/pence
                    currency: data.currency.toLowerCase(),
                    recurring: {
                        interval: data.billingPeriod === "monthly" ? "month" : "year",
                        interval_count: 1,
                    },
                });

                // 5. Create payment link for paid subscriptions only
                const stripePaymentLink = await stripe.paymentLinks.create({
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
                        isFreeTier: "false",
                    },
                    after_completion: {
                        type: "redirect",
                        redirect: {
                            url: `${config.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                        },
                    },
                });

                paymentLink = stripePaymentLink.url;
            } else {
                // Handle invalid cases
                throw new Error("Invalid subscription configuration");
            }

            return {
                stripeProductId: product.id,
                stripePriceId: price?.id || "free_tier",
                paymentLink: paymentLink,
            };
        } catch (error) {
            console.error("Stripe product creation failed:", error);
            throw new Error(`Failed to create Stripe product: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    // Check if a payment link is for a free tier
    isFreeTier(paymentLink: string): boolean {
        return paymentLink.startsWith("free-tier-");
    }

    // Get free tier details from payment link
    getFreeTierDetails(paymentLink: string): { type: string; level: string } | null {
        if (!this.isFreeTier(paymentLink)) return null;

        const parts = paymentLink.split("-");
        if (parts.length >= 4) {
            return {
                type: parts[2].toUpperCase(),
                level: parts[3],
            };
        }
        return null;
    }

    // Create checkout session for subscriptions with proper metadata
    async createCheckoutSession(priceId: string, metadata: CheckoutSessionMetadata, customerId?: string) {
        try {
            console.log("🎯 Creating checkout session with metadata:", metadata);

            // For free tiers, don't create Stripe checkout session
            if (priceId === "free_tier") {
                throw new Error("Free tiers do not require checkout sessions");
            }

            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                payment_method_types: ["card"],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                customer_email: metadata.userEmail,
                customer: customerId,
                // Add metadata to the session
                metadata: {
                    userId: metadata.userId, // Real MongoDB user ID
                    subscriptionPlanId: metadata.subscriptionPlanId, // Real subscription plan ID
                    type: metadata.type,
                    level: metadata.level,
                    userEmail: metadata.userEmail || "",
                    userName: metadata.userName || "",
                },
                // Also add metadata to subscription for redundancy
                subscription_data: {
                    metadata: {
                        userId: metadata.userId,
                        subscriptionPlanId: metadata.subscriptionPlanId,
                        type: metadata.type,
                        level: metadata.level,
                        userEmail: metadata.userEmail || "",
                        userName: metadata.userName || "",
                    },
                },
                success_url: `${config.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${config.client_url}/payment/cancel`,
                // Enable customer creation if no customerId provided
                customer_creation: customerId ? undefined : "always",
            });

            console.log("✅ Checkout session created:", session.id);
            return session;
        } catch (error) {
            console.error("❌ Checkout session creation failed:", error);
            throw new Error("Failed to create checkout session");
        }
    }

    async createCheckoutSessionWithUser(priceId: string, metadata: CheckoutSessionMetadata, customerId?: string) {
        try {
            console.log("🎯 Creating authenticated checkout session with metadata:", metadata);
            console.log("💰 Price ID:", priceId);
            console.log("👤 Customer ID:", customerId);

            // Build the session parameters
            const sessionParams: any = {
                mode: "subscription",
                payment_method_types: ["card"],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                customer_email: metadata.userEmail,
                success_url: `${config.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${config.client_url}/payment/cancel`,

                // CRITICAL: Add comprehensive metadata
                metadata: {
                    userId: metadata.userId,
                    subscriptionPlanId: metadata.subscriptionPlanId,
                    type: metadata.type,
                    level: metadata.level,
                    userEmail: metadata.userEmail,
                    userName: metadata.userName,
                    source: "authenticated_checkout",
                },

                // Also add to subscription data
                subscription_data: {
                    metadata: {
                        userId: metadata.userId,
                        subscriptionPlanId: metadata.subscriptionPlanId,
                        type: metadata.type,
                        level: metadata.level,
                        userEmail: metadata.userEmail,
                        userName: metadata.userName,
                        realUserId: metadata.userId,
                    },
                },
            };

            // FIX: Only add customer if provided, don't use customer_creation in subscription mode
            if (customerId) {
                sessionParams.customer = customerId;
                console.log("✅ Using existing customer:", customerId);
            } else {
                console.log("ℹ️ No customer ID provided - Stripe will create one automatically");
                // Don't add customer_creation - Stripe will handle customer creation automatically
            }

            console.log("📦 Session params:", JSON.stringify(sessionParams, null, 2));

            const session = await stripe.checkout.sessions.create(sessionParams);

            console.log("✅ Authenticated checkout session created:", session.id);
            console.log("🔗 Checkout URL:", session.url);
            return session;
        } catch (error: any) {
            console.error("❌ STRIPE ERROR DETAILS:");
            console.error("Error type:", error.type);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);

            throw new Error(`Failed to create checkout session: ${error.message}`);
        }
    }

    // Create customer in Stripe
    async createCustomer(userId: string, email: string, name?: string) {
        try {
            const customer = await stripe.customers.create({
                email: email,
                name: name,
                metadata: {
                    userId: userId, // Link to your MongoDB user ID
                },
            });

            console.log("✅ Stripe customer created:", customer.id);
            return customer;
        } catch (error) {
            console.error("❌ Stripe customer creation failed:", error);
            throw new Error("Failed to create Stripe customer");
        }
    }

    // Get customer by ID
    async getCustomer(customerId: string) {
        try {
            return await stripe.customers.retrieve(customerId);
        } catch (error) {
            console.error("Failed to retrieve customer:", error);
            throw new Error("Failed to get customer details");
        }
    }

    // Create direct subscription (for testing or admin use)
    async createDirectSubscription(customerId: string, priceId: string, metadata: CheckoutSessionMetadata) {
        try {
            // Don't create Stripe subscription for free tiers
            if (priceId === "free_tier") {
                throw new Error("Free tiers do not require Stripe subscriptions");
            }

            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [
                    {
                        price: priceId,
                    },
                ],
                metadata: {
                    userId: metadata.userId,
                    subscriptionPlanId: metadata.subscriptionPlanId,
                    type: metadata.type,
                    level: metadata.level,
                },
                payment_behavior: "default_incomplete",
                payment_settings: { save_default_payment_method: "on_subscription" },
                expand: ["latest_invoice.payment_intent"],
            });

            console.log("✅ Direct subscription created:", subscription.id);
            return subscription;
        } catch (error) {
            console.error("❌ Direct subscription creation failed:", error);
            throw new Error("Failed to create direct subscription");
        }
    }

    // Update subscription product
    async updateSubscriptionProduct(stripeProductId: string, data: Partial<CreateProductData>): Promise<void> {
        try {
            const metadata: Record<string, string> = {};

            if (data.type) metadata.type = data.type;
            if (data.level) {
                metadata.level = data.level;
                metadata.subscriptionTier = `${data.type}_${data.level}`;
            }
            if (data.billingPeriod) metadata.billingPeriod = data.billingPeriod;

            await stripe.products.update(stripeProductId, {
                name: data.name,
                description: data.description,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            });
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

    // Create portal session for subscription management
    async createCustomerPortalSession(customerId: string, returnUrl: string) {
        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
            });

            return session;
        } catch (error) {
            console.error("Portal session creation failed:", error);
            throw new Error("Failed to create customer portal session");
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
            return await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ["customer", "latest_invoice"],
            });
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

    // Get product details
    async getProduct(productId: string) {
        try {
            return await stripe.products.retrieve(productId);
        } catch (error) {
            console.error("Failed to retrieve product:", error);
            throw new Error("Failed to get product details");
        }
    }

    // Retrieve checkout session (useful for success page)
    async getCheckoutSession(sessionId: string) {
        try {
            return await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ["subscription", "customer"],
            });
        } catch (error) {
            console.error("Failed to retrieve checkout session:", error);
            throw new Error("Failed to get checkout session details");
        }
    }

    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card
    // save card

    /**
     * Create and attach payment method to customer
     */
    async createPaymentMethod(customerId: string, paymentMethodId: string, isDefault: boolean = false) {
        try {
            // Attach payment method to customer
            await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });

            // Retrieve payment method details
            const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

            // Set as default if requested
            if (isDefault) {
                await this.stripe.customers.update(customerId, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
            }

            return paymentMethod;
        } catch (error) {
            console.error("Error creating payment method:", error);
            throw new Error(`Failed to create payment method: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Get customer's payment methods
     */
    async getCustomerPaymentMethods(customerId: string) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: "card",
            });
            return paymentMethods;
        } catch (error) {
            console.error("Error getting customer payment methods:", error);
            throw new Error("Failed to get payment methods");
        }
    }

    /**
     * Set default payment method for customer
     */
    async setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
        try {
            await this.stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        } catch (error) {
            console.error("Error setting default payment method:", error);
            throw new Error("Failed to set default payment method");
        }
    }

    /**
     * Detach payment method from customer
     */
    async detachPaymentMethod(paymentMethodId: string) {
        try {
            await this.stripe.paymentMethods.detach(paymentMethodId);
        } catch (error) {
            console.error("Error detaching payment method:", error);
            throw new Error("Failed to detach payment method");
        }
    }

    // Add stripe instance getter if needed
    private get stripe() {
        // You might want to make this a private property in your class
        const stripe = new Stripe(config.stripe_secret_key!, {
            apiVersion: "2025-09-30.clover",
        });
        return stripe;
    }

    // connect stripe
    // connect stripe
    // connect stripe
    // connect stripe
    // connect stripe
    // connect stripe
    // connect stripe
    // connect stripe
    // connect stripe
    // connect stripe
    // connect stripe

    // Add this to your existing stripeService.ts at the bottom

    // =============================================
    // STRIPE CONNECT FUNCTIONALITY
    // =============================================

    /**
     * Create Stripe Connect Express account for host
     */
    async createConnectAccount(userId: string, email: string, name: string) {
        try {
            console.log("🔍 config.client_url:", config.client_url);
            // const businessUrl = config.client_url && config.client_url.startsWith("http") ? config.client_url : "https://your-app-domain.com"; // Fallback URL

            const account = await stripe.accounts.create({
                type: "express",
                country: "GB",
                email: email,
                business_type: "individual",
                capabilities: {
                    transfers: { requested: true },
                    card_payments: { requested: true },
                },
                business_profile: {
                    name: name,
                    url: "https://your-app-domain.com",
                },
                metadata: {
                    userId: userId,
                },
            });

            console.log("✅ Stripe Connect account created:", account.id);
            return account;
        } catch (error) {
            console.error("Error creating Stripe Connect account:", error);
            throw new Error(`Failed to create Stripe account: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Create account link for host onboarding
     */
    async createAccountLink(accountId: string, userId: string) {
        console.log("🔍 config.client_url 2:", config.client_url);
        try {
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${config.client_url}/messages?stripe=failed`,
                return_url: `${config.client_url}/messages?stripe=success`,
                // refresh_url: `${config.client_url}/stripe/retry?userId=${userId}`,
                // return_url: `${config.client_url}/stripe/success?userId=${userId}`,
                type: "account_onboarding",
            });

            console.log("✅ Account link created for:", accountId);
            return accountLink;
        } catch (error) {
            console.error("Error creating account link:", error);
            throw new Error(`Failed to create account link: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Check Stripe Connect account status
     */
    async getConnectAccountStatus(accountId: string) {
        try {
            const account = await stripe.accounts.retrieve(accountId);

            const status = {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                status: account.charges_enabled && account.payouts_enabled ? "verified" : "pending",
            };

            // console.log("✅ Account status retrieved:", accountId, status);
            return status;
        } catch (error) {
            console.error("Error getting account status:", error);
            throw new Error(`Failed to get account status: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Create login link for host to access Stripe dashboard
     */
    async createLoginLink(accountId: string) {
        try {
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            console.log("✅ Login link created for:", accountId);
            return loginLink;
        } catch (error) {
            console.error("Error creating login link:", error);
            throw new Error(`Failed to create login link: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    // if card is not saved
    async createCustomer2(customerData: { email: string; name?: string; metadata?: any }) {
        try {
            const customer = await this.stripe.customers.create({
                email: customerData.email,
                name: customerData.name,
                metadata: customerData.metadata || {},
            });

            console.log("✅ Stripe customer created:", customer.id);
            return customer;
        } catch (error) {
            console.error("Error creating Stripe customer:", error);
            throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    // saved card payment

    /**
     * Create payment with Stripe Connect (for commission split)
     */

    async createConnectPayment(amount: number, hostAccountId: string, customerId: string, applicationFeeAmount: number) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: "gbp",
                customer: customerId,
                application_fee_amount: Math.round(applicationFeeAmount * 100),
                transfer_data: {
                    destination: hostAccountId,
                },
                on_behalf_of: hostAccountId,
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    paymentType: "connect_booking",
                    hostAccountId: hostAccountId,
                },
            });

            console.log("✅ Connect payment intent created:", paymentIntent.id);
            return paymentIntent;
        } catch (error) {
            console.error("Error creating connect payment:", error);
            throw new Error(`Failed to create connect payment: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
                return_url: `${config.client_url}/payment/success`,
            });

            console.log(`✅ PaymentIntent ${paymentIntentId} confirmed with status: ${paymentIntent.status}`);
            return paymentIntent;
        } catch (error) {
            console.error("Error confirming PaymentIntent:", error);
            throw new Error(`Failed to confirm PaymentIntent: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}

export const stripeService = new StripeService();
