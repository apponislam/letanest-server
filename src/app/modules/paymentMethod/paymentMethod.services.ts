import httpStatus from "http-status";
import { Types } from "mongoose";
import { IPaymentMethodCreate } from "./paymentMethod.interface";
import { IPaymentMethodDocument, PaymentMethod } from "./paymentMethod.model";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { stripeService } from "../subscription/stripe.services";

/**
 * Get or create Stripe customer for a user
 */
const getOrCreateStripeCustomer = async (userId: Types.ObjectId): Promise<string> => {
    // Find user in database
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // If user already has a Stripe customer ID, return it
    if (user.stripeCustomerId) {
        return user.stripeCustomerId;
    }

    // Create new Stripe customer using your enhanced service
    try {
        const customer = await stripeService.createCustomer(userId.toString(), user.email, user.name);

        // Update user with new Stripe customer ID
        user.stripeCustomerId = customer.id;
        await user.save();

        return customer.id;
    } catch (error) {
        console.error("Error creating Stripe customer:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create Stripe customer");
    }
};

/**
 * Create a new payment method
 */
const createPaymentMethod = async (paymentMethodData: IPaymentMethodCreate): Promise<IPaymentMethodDocument> => {
    const { userId, paymentMethodId, isDefault = false } = paymentMethodData;

    // Step 1: Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(userId);
    console.log("Stripe Customer ID:", stripeCustomerId);

    // Step 2: Use your enhanced StripeService to handle payment method
    const stripePaymentMethod = await stripeService.createPaymentMethod(stripeCustomerId, paymentMethodId, isDefault);

    // Step 3: Validate that it's a card and get card details
    if (stripePaymentMethod.type !== "card" || !stripePaymentMethod.card) {
        // Detach the payment method since it's not a card
        await stripeService.detachPaymentMethod(paymentMethodId);
        throw new ApiError(httpStatus.BAD_REQUEST, "Only card payment methods are supported");
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
        await PaymentMethod.updateMany({ userId, isDefault: true }, { isDefault: false });
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

    const paymentMethod = new PaymentMethod(paymentMethodDataToSave);
    return await paymentMethod.save();
};

/**
 * Get payment methods by user ID with user details populated
 */
const getPaymentMethodsByUserId = async (userId: Types.ObjectId): Promise<IPaymentMethodDocument[]> => {
    return await PaymentMethod.find({ userId }).populate("userId", "name email profileImg").sort({ isDefault: -1, createdAt: -1 });
};

/**
 * Get payment method by ID with user populated
 */
const getPaymentMethodById = async (paymentMethodId: string): Promise<IPaymentMethodDocument> => {
    if (!Types.ObjectId.isValid(paymentMethodId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid payment method ID");
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId).populate("userId", "name email profileImg");

    if (!paymentMethod) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment method not found");
    }
    return paymentMethod;
};

/**
 * Get payment method by Stripe payment method ID
 */
const getPaymentMethodByStripeId = async (stripePaymentMethodId: string): Promise<IPaymentMethodDocument | null> => {
    return await PaymentMethod.findOne({ paymentMethodId: stripePaymentMethodId }).populate("userId", "name email profileImg");
};

/**
 * Set payment method as default
 */
const setDefaultPaymentMethod = async (userId: Types.ObjectId, paymentMethodId: string): Promise<IPaymentMethodDocument> => {
    const session = await PaymentMethod.startSession();
    session.startTransaction();

    try {
        // Unset all default payment methods for this user
        await PaymentMethod.updateMany({ userId, isDefault: true }, { isDefault: false }, { session });

        // Set the specified payment method as default
        const updatedPaymentMethod = await PaymentMethod.findOneAndUpdate({ _id: paymentMethodId, userId }, { isDefault: true }, { new: true, session }).populate("userId", "name email profileImg");

        if (!updatedPaymentMethod) {
            throw new ApiError(httpStatus.NOT_FOUND, "Payment method not found");
        }

        // Also update in Stripe using your enhanced service
        try {
            await stripeService.setDefaultPaymentMethod(updatedPaymentMethod.stripeCustomerId, updatedPaymentMethod.paymentMethodId);
        } catch (error) {
            console.error("Error updating default in Stripe:", error);
            // Continue even if Stripe update fails
        }

        await session.commitTransaction();
        return updatedPaymentMethod;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Delete payment method
 */
const deletePaymentMethod = async (userId: Types.ObjectId, paymentMethodId: string): Promise<void> => {
    const paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, userId });

    if (!paymentMethod) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment method not found");
    }

    const session = await PaymentMethod.startSession();
    session.startTransaction();

    try {
        try {
            await stripeService.detachPaymentMethod(paymentMethod.paymentMethodId);
        } catch (error) {
            console.error("Error detaching payment method from Stripe:", error);
        }
        if (paymentMethod.isDefault) {
            const otherPaymentMethod = await PaymentMethod.findOne({
                userId,
                _id: { $ne: paymentMethodId },
            }).sort({ createdAt: -1 });
            if (otherPaymentMethod) {
                await PaymentMethod.findByIdAndUpdate(otherPaymentMethod._id, { isDefault: true });
                try {
                    await stripeService.setDefaultPaymentMethod(paymentMethod.stripeCustomerId, otherPaymentMethod.paymentMethodId);
                } catch (error) {
                    console.error("Error updating Stripe default:", error);
                }
            } else {
                console.log("No other payment methods found. Stripe will handle default payment method automatically.");
            }
        }
        await PaymentMethod.findByIdAndDelete(paymentMethodId, { session });
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get default payment method for user
 */
const getDefaultPaymentMethod = async (userId: Types.ObjectId): Promise<IPaymentMethodDocument | null> => {
    return await PaymentMethod.findOne({ userId, isDefault: true }).populate("userId", "name email profileImg");
};

/**
 * Check if user owns the payment method
 */
const validatePaymentMethodOwnership = async (userId: Types.ObjectId, paymentMethodId: string): Promise<boolean> => {
    const paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, userId });
    return !!paymentMethod;
};

export const paymentMethodServices = {
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
