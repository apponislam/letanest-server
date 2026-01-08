"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../../config"));
const stripe = new stripe_1.default(config_1.default.stripe_secret_key, {
    // apiVersion: "2025-09-30.clover",
    apiVersion: "2025-07-30.basil",
});
class StripeService {
    // Create subscription product in Stripe
    createSubscriptionProduct(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 1. Create product in Stripe
                const product = yield stripe.products.create({
                    name: data.name,
                    description: data.description,
                    metadata: {
                        type: data.type,
                        level: data.level,
                        billingPeriod: data.billingPeriod,
                        subscriptionTier: `${data.type}_${data.level}`,
                    },
                });
                let price = null;
                let paymentLink;
                // 2. For free tiers, create a one-time price and use simple payment link
                if (data.cost === 0) {
                    price = yield stripe.prices.create({
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
                    price = yield stripe.prices.create({
                        product: product.id,
                        unit_amount: Math.round(data.cost * 100), // Convert to cents/pence
                        currency: data.currency.toLowerCase(),
                        recurring: {
                            interval: data.billingPeriod === "monthly" ? "month" : "year",
                            interval_count: 1,
                        },
                    });
                    // 5. Create payment link for paid subscriptions only
                    const stripePaymentLink = yield stripe.paymentLinks.create({
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
                                url: `${config_1.default.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                            },
                        },
                    });
                    paymentLink = stripePaymentLink.url;
                }
                else {
                    // Handle invalid cases
                    throw new Error("Invalid subscription configuration");
                }
                return {
                    stripeProductId: product.id,
                    stripePriceId: (price === null || price === void 0 ? void 0 : price.id) || "free_tier",
                    paymentLink: paymentLink,
                };
            }
            catch (error) {
                console.error("Stripe product creation failed:", error);
                throw new Error(`Failed to create Stripe product: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    // Check if a payment link is for a free tier
    isFreeTier(paymentLink) {
        return paymentLink.startsWith("free-tier-");
    }
    // Get free tier details from payment link
    getFreeTierDetails(paymentLink) {
        if (!this.isFreeTier(paymentLink))
            return null;
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
    createCheckoutSession(priceId, metadata, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🎯 Creating checkout session with metadata:", metadata);
                // For free tiers, don't create Stripe checkout session
                if (priceId === "free_tier") {
                    throw new Error("Free tiers do not require checkout sessions");
                }
                const session = yield stripe.checkout.sessions.create({
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
                    success_url: `${config_1.default.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${config_1.default.client_url}/payment/cancel`,
                    // Enable customer creation if no customerId provided
                    customer_creation: customerId ? undefined : "always",
                });
                console.log("✅ Checkout session created:", session.id);
                return session;
            }
            catch (error) {
                console.error("❌ Checkout session creation failed:", error);
                throw new Error("Failed to create checkout session");
            }
        });
    }
    // Create customer in Stripe
    createCheckoutSessionWithUser(priceId, metadata, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Build the session parameters
                const sessionParams = {
                    mode: "subscription",
                    payment_method_types: ["card"],
                    line_items: [
                        {
                            price: priceId,
                            quantity: 1,
                        },
                    ],
                    success_url: `${config_1.default.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${config_1.default.client_url}/payment/cancel`,
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
                if (customerId) {
                    // Use existing customer
                    sessionParams.customer = customerId;
                    console.log("✅ Using existing customer:", customerId);
                }
                else {
                    // Create new customer with email
                    sessionParams.customer_email = metadata.userEmail;
                    console.log("✅ Creating new customer with email:", metadata.userEmail);
                }
                console.log("📦 Session params:", JSON.stringify(sessionParams, null, 2));
                const session = yield stripe.checkout.sessions.create(sessionParams);
                console.log("✅ Authenticated checkout session created:", session.id);
                console.log("🔗 Checkout URL:", session.url);
                return session;
            }
            catch (error) {
                console.error("❌ STRIPE ERROR DETAILS:");
                console.error("Error type:", error.type);
                console.error("Error code:", error.code);
                console.error("Error message:", error.message);
                throw new Error(`Failed to create checkout session: ${error.message}`);
            }
        });
    }
    createCustomer(userId, email, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield stripe.customers.create({
                    email: email,
                    name: name,
                    metadata: {
                        userId: userId, // Link to your MongoDB user ID
                    },
                });
                console.log("✅ Stripe customer created:", customer.id);
                return customer;
            }
            catch (error) {
                console.error("❌ Stripe customer creation failed:", error);
                throw new Error("Failed to create Stripe customer");
            }
        });
    }
    // Get customer by ID
    getCustomer(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield stripe.customers.retrieve(customerId);
            }
            catch (error) {
                console.error("Failed to retrieve customer:", error);
                throw new Error("Failed to get customer details");
            }
        });
    }
    // Create direct subscription (for testing or admin use)
    createDirectSubscription(customerId, priceId, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Don't create Stripe subscription for free tiers
                if (priceId === "free_tier") {
                    throw new Error("Free tiers do not require Stripe subscriptions");
                }
                const subscription = yield stripe.subscriptions.create({
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
            }
            catch (error) {
                console.error("❌ Direct subscription creation failed:", error);
                throw new Error("Failed to create direct subscription");
            }
        });
    }
    // Update subscription product
    updateSubscriptionProduct(stripeProductId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const metadata = {};
                if (data.type)
                    metadata.type = data.type;
                if (data.level) {
                    metadata.level = data.level;
                    metadata.subscriptionTier = `${data.type}_${data.level}`;
                }
                if (data.billingPeriod)
                    metadata.billingPeriod = data.billingPeriod;
                yield stripe.products.update(stripeProductId, {
                    name: data.name,
                    description: data.description,
                    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
                });
            }
            catch (error) {
                console.error("Stripe product update failed:", error);
                throw new Error("Failed to update Stripe product");
            }
        });
    }
    // Archive/delete subscription product
    archiveSubscriptionProduct(stripeProductId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield stripe.products.update(stripeProductId, {
                    active: false,
                });
            }
            catch (error) {
                console.error("Stripe product archiving failed:", error);
                throw new Error("Failed to archive Stripe product");
            }
        });
    }
    // Create portal session for subscription management
    createCustomerPortalSession(customerId, returnUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const session = yield stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: returnUrl,
                });
                return session;
            }
            catch (error) {
                console.error("Portal session creation failed:", error);
                throw new Error("Failed to create customer portal session");
            }
        });
    }
    // Handle webhook events
    handleWebhookEvent(payload, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // console.log(payload);
                // console.log(signature);
                // console.log(config.stripe_webhook_secret);
                const event = stripe.webhooks.constructEvent(payload, signature, config_1.default.stripe_webhook_secret);
                return event;
            }
            catch (error) {
                console.error("Webhook signature verification failed:", error);
                throw new Error("Invalid webhook signature");
            }
        });
    }
    // Get subscription details
    getSubscription(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield stripe.subscriptions.retrieve(subscriptionId, {
                    expand: ["customer", "latest_invoice"],
                });
            }
            catch (error) {
                console.error("Failed to retrieve subscription:", error);
                throw new Error("Failed to get subscription details");
            }
        });
    }
    // Cancel subscription
    cancelSubscription(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield stripe.subscriptions.retrieve(subscriptionId);
                if (subscription.status === "canceled") {
                    throw new Error(`Subscription ${subscriptionId} is already cancelled`);
                }
                const cancelled = yield stripe.subscriptions.cancel(subscriptionId);
                console.log(`✅ Subscription ${subscriptionId} cancelled successfully`);
                return cancelled;
            }
            catch (error) {
                console.error("Failed to cancel subscription:", error);
                throw new Error(`Failed to cancel subscription: ${error.message}`);
            }
        });
    }
    // Get product details
    getProduct(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield stripe.products.retrieve(productId);
            }
            catch (error) {
                console.error("Failed to retrieve product:", error);
                throw new Error("Failed to get product details");
            }
        });
    }
    // Retrieve checkout session (useful for success page)
    getCheckoutSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield stripe.checkout.sessions.retrieve(sessionId, {
                    expand: ["subscription", "customer"],
                });
            }
            catch (error) {
                console.error("Failed to retrieve checkout session:", error);
                throw new Error("Failed to get checkout session details");
            }
        });
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
    createPaymentMethod(customerId_1, paymentMethodId_1) {
        return __awaiter(this, arguments, void 0, function* (customerId, paymentMethodId, isDefault = false) {
            try {
                // Attach payment method to customer
                yield stripe.paymentMethods.attach(paymentMethodId, {
                    customer: customerId,
                });
                // Retrieve payment method details
                const paymentMethod = yield stripe.paymentMethods.retrieve(paymentMethodId);
                // Set as default if requested
                if (isDefault) {
                    yield stripe.customers.update(customerId, {
                        invoice_settings: {
                            default_payment_method: paymentMethodId,
                        },
                    });
                }
                return paymentMethod;
            }
            catch (error) {
                console.error("Error creating payment method:", error);
                throw new Error(`Failed to create payment method: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    /**
     * Get customer's payment methods
     */
    getCustomerPaymentMethods(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paymentMethods = yield stripe.paymentMethods.list({
                    customer: customerId,
                    type: "card",
                });
                return paymentMethods;
            }
            catch (error) {
                console.error("Error getting customer payment methods:", error);
                throw new Error("Failed to get payment methods");
            }
        });
    }
    /**
     * Set default payment method for customer
     */
    setDefaultPaymentMethod(customerId, paymentMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield stripe.customers.update(customerId, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
            }
            catch (error) {
                console.error("Error setting default payment method:", error);
                throw new Error("Failed to set default payment method");
            }
        });
    }
    /**
     * Detach payment method from customer
     */
    detachPaymentMethod(paymentMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield stripe.paymentMethods.detach(paymentMethodId);
            }
            catch (error) {
                console.error("Error detaching payment method:", error);
                throw new Error("Failed to detach payment method");
            }
        });
    }
    // Add stripe instance getter if needed
    // private get stripe() {
    //     // You might want to make this a private property in your class
    //     const stripe = new Stripe(config.stripe_secret_key!, {
    //         apiVersion: "2025-07-30.basil" as any,
    //     });
    //     return stripe;
    // }
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
    createConnectAccount(userId, email, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🔍 config.client_url:", config_1.default.client_url);
                // const businessUrl = config.client_url && config.client_url.startsWith("http") ? config.client_url : "https://your-app-domain.com"; // Fallback URL
                const account = yield stripe.accounts.create({
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
            }
            catch (error) {
                console.error("Error creating Stripe Connect account:", error);
                throw new Error(`Failed to create Stripe account: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    /**
     * Create account link for host onboarding
     */
    createAccountLink(accountId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("🔍 config.client_url 2:", config_1.default.client_url);
            try {
                const accountLink = yield stripe.accountLinks.create({
                    account: accountId,
                    refresh_url: `${config_1.default.client_url}/messages?stripe=failed`,
                    return_url: `${config_1.default.client_url}/messages?stripe=success`,
                    // refresh_url: `${config.client_url}/stripe/retry?userId=${userId}`,
                    // return_url: `${config.client_url}/stripe/success?userId=${userId}`,
                    type: "account_onboarding",
                });
                console.log("✅ Account link created for:", accountId);
                return accountLink;
            }
            catch (error) {
                console.error("Error creating account link:", error);
                throw new Error(`Failed to create account link: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    /**
     * Check Stripe Connect account status
     */
    getConnectAccountStatus(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = yield stripe.accounts.retrieve(accountId);
                const status = {
                    chargesEnabled: account.charges_enabled,
                    payoutsEnabled: account.payouts_enabled,
                    detailsSubmitted: account.details_submitted,
                    status: account.charges_enabled && account.payouts_enabled ? "verified" : "pending",
                };
                // console.log("✅ Account status retrieved:", accountId, status);
                return status;
            }
            catch (error) {
                console.error("Error getting account status:", error);
                throw new Error(`Failed to get account status: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    /**
     * Create login link for host to access Stripe dashboard
     */
    createLoginLink(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loginLink = yield stripe.accounts.createLoginLink(accountId);
                console.log("✅ Login link created for:", accountId);
                return loginLink;
            }
            catch (error) {
                console.error("Error creating login link:", error);
                throw new Error(`Failed to create login link: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    // if card is not saved
    createCustomer2(customerData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield stripe.customers.create({
                    email: customerData.email,
                    name: customerData.name,
                    metadata: customerData.metadata || {},
                });
                console.log("✅ Stripe customer created:", customer.id);
                return customer;
            }
            catch (error) {
                console.error("Error creating Stripe customer:", error);
                throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    // saved card payment
    /**
     * Create payment with Stripe Connect (for commission split)
     */
    createConnectPayment(amount, hostAccountId, customerId, applicationFeeAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paymentIntent = yield stripe.paymentIntents.create({
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
            }
            catch (error) {
                console.error("Error creating connect payment:", error);
                throw new Error(`Failed to create connect payment: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    confirmPaymentIntent(paymentIntentId, paymentMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paymentIntent = yield stripe.paymentIntents.confirm(paymentIntentId, {
                    payment_method: paymentMethodId,
                    return_url: `${config_1.default.client_url}/payment/success`,
                });
                console.log(`✅ PaymentIntent ${paymentIntentId} confirmed with status: ${paymentIntent.status}`);
                return paymentIntent;
            }
            catch (error) {
                console.error("Error confirming PaymentIntent:", error);
                throw new Error(`Failed to confirm PaymentIntent: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    // only booking fee payment
    createBookingFeePayment(bookingFee, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paymentIntent = yield stripe.paymentIntents.create({
                    amount: Math.round(bookingFee * 100),
                    currency: "gbp",
                    customer: customerId,
                    automatic_payment_methods: {
                        enabled: true,
                    },
                    metadata: {
                        paymentType: "booking_fee",
                    },
                });
                console.log("✅ Booking fee payment intent created:", paymentIntent.id);
                return paymentIntent;
            }
            catch (error) {
                console.error("Error creating booking fee payment:", error);
                throw new Error(`Failed to create booking fee payment: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    confirmBookingFeePayment(paymentIntentId, paymentMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paymentIntent = yield stripe.paymentIntents.confirm(paymentIntentId, {
                    payment_method: paymentMethodId,
                    return_url: `${config_1.default.client_url}/payment/success`,
                });
                console.log(`✅ Booking fee PaymentIntent ${paymentIntentId} confirmed with status: ${paymentIntent.status}`);
                return paymentIntent;
            }
            catch (error) {
                console.error("Error confirming booking fee PaymentIntent:", error);
                throw new Error(`Failed to confirm booking fee PaymentIntent: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
}
exports.StripeService = StripeService;
exports.stripeService = new StripeService();
