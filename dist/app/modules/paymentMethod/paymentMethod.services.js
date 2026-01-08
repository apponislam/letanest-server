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
exports.paymentMethodServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const paymentMethod_model_1 = require("./paymentMethod.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const auth_model_1 = require("../auth/auth.model");
const stripe_services_1 = require("../subscription/stripe.services");
/**
 * Get or create Stripe customer for a user
 */
const getOrCreateStripeCustomer = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user in database
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // If user already has a Stripe customer ID, return it
    if (user.stripeCustomerId) {
        return user.stripeCustomerId;
    }
    // Create new Stripe customer using your enhanced service
    try {
        const customer = yield stripe_services_1.stripeService.createCustomer(userId.toString(), user.email, user.name);
        // Update user with new Stripe customer ID
        user.stripeCustomerId = customer.id;
        yield user.save();
        return customer.id;
    }
    catch (error) {
        console.error("Error creating Stripe customer:", error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create Stripe customer");
    }
});
/**
 * Create a new payment method
 */
const createPaymentMethod = (paymentMethodData) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, paymentMethodId, isDefault = false } = paymentMethodData;
    // Step 1: Get or create Stripe customer
    const stripeCustomerId = yield getOrCreateStripeCustomer(userId);
    console.log("Stripe Customer ID:", stripeCustomerId);
    // Step 2: Use your enhanced StripeService to handle payment method
    const stripePaymentMethod = yield stripe_services_1.stripeService.createPaymentMethod(stripeCustomerId, paymentMethodId, isDefault);
    // Step 3: Validate that it's a card and get card details
    if (stripePaymentMethod.type !== "card" || !stripePaymentMethod.card) {
        // Detach the payment method since it's not a card
        yield stripe_services_1.stripeService.detachPaymentMethod(paymentMethodId);
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Only card payment methods are supported");
    }
    // Extract card details
    const cardDetails = stripePaymentMethod.card;
    console.log("Card details:", {
        brand: cardDetails.brand,
        last4: cardDetails.last4,
        exp_month: cardDetails.exp_month,
        exp_year: cardDetails.exp_year,
    });
    // Step 4: If this is set as default, unset any existing default for this user in our DB
    if (isDefault) {
        yield paymentMethod_model_1.PaymentMethod.updateMany({ userId, isDefault: true }, { isDefault: false });
    }
    // Step 5: Save to our database with all required fields
    const paymentMethodDataToSave = {
        userId,
        stripeCustomerId,
        paymentMethodId,
        brand: cardDetails.brand,
        last4: cardDetails.last4,
        exp_month: cardDetails.exp_month,
        exp_year: cardDetails.exp_year,
        isDefault,
    };
    console.log("Saving payment method to database:", paymentMethodDataToSave);
    const paymentMethod = new paymentMethod_model_1.PaymentMethod(paymentMethodDataToSave);
    return yield paymentMethod.save();
});
/**
 * Get payment methods by user ID with user details populated
 */
const getPaymentMethodsByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield paymentMethod_model_1.PaymentMethod.find({ userId }).populate("userId", "name email profileImg").sort({ isDefault: -1, createdAt: -1 });
});
/**
 * Get payment method by ID with user populated
 */
const getPaymentMethodById = (paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(paymentMethodId)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid payment method ID");
    }
    const paymentMethod = yield paymentMethod_model_1.PaymentMethod.findById(paymentMethodId).populate("userId", "name email profileImg");
    if (!paymentMethod) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Payment method not found");
    }
    return paymentMethod;
});
/**
 * Get payment method by Stripe payment method ID
 */
const getPaymentMethodByStripeId = (stripePaymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield paymentMethod_model_1.PaymentMethod.findOne({ paymentMethodId: stripePaymentMethodId }).populate("userId", "name email profileImg");
});
/**
 * Set payment method as default
 */
const setDefaultPaymentMethod = (userId, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield paymentMethod_model_1.PaymentMethod.startSession();
    session.startTransaction();
    try {
        // Unset all default payment methods for this user
        yield paymentMethod_model_1.PaymentMethod.updateMany({ userId, isDefault: true }, { isDefault: false }, { session });
        // Set the specified payment method as default
        const updatedPaymentMethod = yield paymentMethod_model_1.PaymentMethod.findOneAndUpdate({ _id: paymentMethodId, userId }, { isDefault: true }, { new: true, session }).populate("userId", "name email profileImg");
        if (!updatedPaymentMethod) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Payment method not found");
        }
        // Also update in Stripe using your enhanced service
        try {
            yield stripe_services_1.stripeService.setDefaultPaymentMethod(updatedPaymentMethod.stripeCustomerId, updatedPaymentMethod.paymentMethodId);
        }
        catch (error) {
            console.error("Error updating default in Stripe:", error);
            // Continue even if Stripe update fails
        }
        yield session.commitTransaction();
        return updatedPaymentMethod;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
/**
 * Delete payment method
 */
const deletePaymentMethod = (userId, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentMethod = yield paymentMethod_model_1.PaymentMethod.findOne({ _id: paymentMethodId, userId });
    if (!paymentMethod) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Payment method not found");
    }
    const session = yield paymentMethod_model_1.PaymentMethod.startSession();
    session.startTransaction();
    try {
        try {
            yield stripe_services_1.stripeService.detachPaymentMethod(paymentMethod.paymentMethodId);
        }
        catch (error) {
            console.error("Error detaching payment method from Stripe:", error);
        }
        if (paymentMethod.isDefault) {
            const otherPaymentMethod = yield paymentMethod_model_1.PaymentMethod.findOne({
                userId,
                _id: { $ne: paymentMethodId },
            }).sort({ createdAt: -1 });
            if (otherPaymentMethod) {
                yield paymentMethod_model_1.PaymentMethod.findByIdAndUpdate(otherPaymentMethod._id, { isDefault: true });
                try {
                    yield stripe_services_1.stripeService.setDefaultPaymentMethod(paymentMethod.stripeCustomerId, otherPaymentMethod.paymentMethodId);
                }
                catch (error) {
                    console.error("Error updating Stripe default:", error);
                }
            }
            else {
                console.log("No other payment methods found. Stripe will handle default payment method automatically.");
            }
        }
        yield paymentMethod_model_1.PaymentMethod.findByIdAndDelete(paymentMethodId, { session });
        yield session.commitTransaction();
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
/**
 * Get default payment method for user
 */
const getDefaultPaymentMethod = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield paymentMethod_model_1.PaymentMethod.findOne({ userId, isDefault: true }).populate("userId", "name email profileImg");
});
/**
 * Check if user owns the payment method
 */
const validatePaymentMethodOwnership = (userId, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentMethod = yield paymentMethod_model_1.PaymentMethod.findOne({ _id: paymentMethodId, userId });
    return !!paymentMethod;
});
exports.paymentMethodServices = {
    createPaymentMethod,
    getPaymentMethodsByUserId,
    getPaymentMethodById,
    getPaymentMethodByStripeId,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    getDefaultPaymentMethod,
    validatePaymentMethodOwnership,
    getOrCreateStripeCustomer,
};
