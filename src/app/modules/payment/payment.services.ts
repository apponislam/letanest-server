import { Types } from "mongoose";
import httpStatus from "http-status";
import { PropertyModel } from "../property/properties.model";
import { CreatePaymentData } from "./payment.interfaces";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { stripeService } from "../subscription/stripe.services";
import { PaymentModel } from "./payment.model";
import { messageServices } from "../messages/message.services";
import { Message } from "../messages/messages.model";

/**
 * Create a new payment
 */
const createPayment = async (data: CreatePaymentData) => {
    // Validate required fields
    if (!data.propertyId || !data.userId || !data.conversationId || !data.messageId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
    }

    const message = await Message.findById(data.messageId);

    if (message?.type !== "offer") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Already payment done or cancelled");
    }

    if (data.totalAmount <= 0 || data.agreedFee <= 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid amount");
    }

    // Get host's Stripe account
    const property = await PropertyModel.findById(data.propertyId).populate("createdBy");
    if (!property) {
        throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
    }

    const host = await UserModel.findById(property.createdBy);
    if (!host?.hostStripeAccount?.stripeAccountId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Host Stripe account not found");
    }

    // Get guest's Stripe customer
    const guest = await UserModel.findById(data.userId);
    if (!guest) {
        throw new ApiError(httpStatus.NOT_FOUND, "Guest user not found");
    }

    let stripeCustomerId = guest.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
        try {
            // Create Stripe customer
            const stripeCustomer = await stripeService.createCustomer2({
                email: guest.email,
                name: guest.name,
                metadata: {
                    userId: guest._id.toString(),
                },
            });

            stripeCustomerId = stripeCustomer.id;

            // Update user with Stripe customer ID
            await UserModel.findByIdAndUpdate(data.userId, {
                stripeCustomerId: stripeCustomerId,
            });

            console.log("✅ Created new Stripe customer:", stripeCustomerId);
        } catch (error) {
            console.error("Error creating Stripe customer:", error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create payment customer");
        }
    }

    // Calculate commission (10% of agreedFee)
    const commissionRate = 10;
    const commissionAmount = data.agreedFee * (commissionRate / 100);
    const hostAmount = data.agreedFee - commissionAmount;

    const platformTotal = commissionAmount + data.bookingFee + (data.extraFee || 0);

    // Calculate platform fees (commission + booking fee)
    const platformFees = platformTotal;

    // Create Stripe Connect payment - use agreedFee as base amount
    const paymentIntent = await stripeService.createConnectPayment(
        data.agreedFee, // Base amount for host + commission
        host.hostStripeAccount.stripeAccountId,
        stripeCustomerId,
        platformFees // Total platform fees
    );

    // Create payment record
    const payment = await PaymentModel.create({
        stripePaymentIntentId: paymentIntent.id,
        agreedFee: data.agreedFee,
        bookingFee: data.bookingFee,
        extraFee: data.extraFee || 0,
        totalAmount: data.totalAmount,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        hostAmount: hostAmount,
        platformTotal,
        userId: new Types.ObjectId(data.userId),
        propertyId: new Types.ObjectId(data.propertyId),
        conversationId: new Types.ObjectId(data.conversationId),
        messageId: new Types.ObjectId(data.messageId),
        status: "pending",
        checkInDate: data.checkInDate || null,
        checkOutDate: data.checkOutDate || null,
    });

    return {
        payment,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
};

/**
 * Confirm payment
 */
const confirmPayment = async (paymentIntentId: string, paymentMethodId: string) => {
    if (!paymentIntentId || !paymentMethodId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Payment intent ID and payment method ID are required");
    }

    // Confirm payment with Stripe
    const paymentIntent = await stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId);

    // Update payment status based on Stripe status
    let status = "pending";

    switch (paymentIntent.status) {
        case "succeeded":
            status = "completed";
            break;
        case "requires_action":
        case "requires_confirmation":
        case "requires_payment_method":
            status = "requires_action";
            break;
        case "canceled":
            status = "canceled";
            break;
        case "processing":
            status = "processing";
            break;
        default:
            status = "pending";
    }

    const payment = await PaymentModel.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        {
            status: status,
            paidAt: paymentIntent.status === "succeeded" ? new Date() : undefined,
            stripePaymentStatus: paymentIntent.status,
        },
        { new: true }
    );

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment record not found");
    }

    const updateAccept = await messageServices.acceptOffer(payment.messageId.toString(), payment.conversationId.toString(), payment.userId.toString());
    console.log(updateAccept);

    return payment;
};

/**
 * Get payment by ID
 */
const getPaymentById = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid payment ID");
    }

    const payment = await PaymentModel.findById(id).populate("userId", "name email").populate("propertyId", "propertyNumber title").populate("conversationId").populate("messageId");

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
    }

    return payment;
};

/**
 * Get payments by user ID
 */
const getPaymentsByUser = async (userId: string) => {
    if (!Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
    }

    return await PaymentModel.find({ userId: new Types.ObjectId(userId) })
        .populate("propertyId", "propertyNumber title")
        .sort({ createdAt: -1 });
};

export const paymentServices = {
    createPayment,
    confirmPayment,
    getPaymentById,
    getPaymentsByUser,
};
