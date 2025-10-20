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
        hostId: new Types.ObjectId(host._id),
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
 * Get payments by user ID (for guests)
 */
const getPaymentsByUser = async (userId: string, query: { page?: number; limit?: number }) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
        PaymentModel.find({ userId: new Types.ObjectId(userId) })
            .populate("hostId", "name email profileImg")
            .populate("propertyId", "title location coverPhoto propertyType amenities")
            .populate("messageId", "checkInDate checkOutDate") // Populate offer details
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        PaymentModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    return {
        payments,
        meta: {
            page,
            limit,
            total,
        },
    };
};

/**
 * Get all payments (for admin)
 */
const getAllPayments = async (filters: any = {}, options: any = {}) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Build filter query
    const filterQuery: any = {};

    if (filters.status) {
        filterQuery.status = filters.status;
    }

    if (filters.propertyId) {
        filterQuery.propertyId = new Types.ObjectId(filters.propertyId);
    }

    if (filters.userId) {
        filterQuery.userId = new Types.ObjectId(filters.userId);
    }

    if (filters.startDate && filters.endDate) {
        filterQuery.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate),
        };
    }

    const payments = await PaymentModel.find(filterQuery)
        .populate("userId", "name email phone")
        .populate({
            path: "propertyId",
            select: "createdBy propertyNumber title address",
            populate: {
                path: "createdBy",
                select: "name",
            },
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

    const total = await PaymentModel.countDocuments(filterQuery);

    return {
        payments,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get payment totals and statistics
 */
const getPaymentTotals = async () => {
    const totals = await PaymentModel.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                totalCommission: { $sum: "$commissionAmount" },
                totalBookingFees: { $sum: "$bookingFee" },
                totalExtraFees: { $sum: "$extraFee" },
                totalPlatformTotal: { $sum: "$platformTotal" },
                totalHostEarnings: { $sum: "$hostAmount" },
                totalTransactions: { $sum: 1 },
                completedTransactions: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
            },
        },
    ]);

    // If no payments exist, return zeros
    if (totals.length === 0) {
        return {
            totalRevenue: 0,
            totalCommission: 0,
            totalBookingFees: 0,
            totalExtraFees: 0,
            totalPlatformTotal: 0,
            totalHostEarnings: 0,
            totalTransactions: 0,
            completedTransactions: 0,
        };
    }

    return totals[0];
};

/**
 * Get payment statistics (for admin dashboard)
 */
const getPaymentStatistics = async () => {
    const totalPayments = await PaymentModel.countDocuments();
    const completedPayments = await PaymentModel.countDocuments({ status: "completed" });
    const pendingPayments = await PaymentModel.countDocuments({ status: "pending" });
    const failedPayments = await PaymentModel.countDocuments({ status: "failed" });

    const totalRevenue = await PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]);

    const platformRevenue = await PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$platformTotal" } } }]);

    const hostRevenue = await PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$hostAmount" } } }]);

    // Monthly revenue
    const monthlyRevenue = await PaymentModel.aggregate([
        { $match: { status: "completed" } },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                total: { $sum: "$totalAmount" },
                platform: { $sum: "$platformTotal" },
                host: { $sum: "$hostAmount" },
            },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    return {
        totals: {
            payments: totalPayments,
            completed: completedPayments,
            pending: pendingPayments,
            failed: failedPayments,
        },
        revenue: {
            total: totalRevenue[0]?.total || 0,
            platform: platformRevenue[0]?.total || 0,
            host: hostRevenue[0]?.total || 0,
        },
        monthly: monthlyRevenue,
    };
};

/**
 * Get payments by host ID
 */
const getPaymentsByHost = async (hostId: string, query: { page?: number; limit?: number }) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [payments, total, totalAmountResult] = await Promise.all([
        PaymentModel.find({ hostId: new Types.ObjectId(hostId) })
            .populate("userId", "name email profileImg")
            .populate("propertyId", "title location coverPhoto propertyType")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        PaymentModel.countDocuments({ hostId: new Types.ObjectId(hostId) }),
        // Calculate total hostAmount
        PaymentModel.aggregate([
            {
                $match: {
                    hostId: new Types.ObjectId(hostId),
                    status: "completed", // Only sum completed payments
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$hostAmount" },
                },
            },
        ]),
    ]);

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

    return {
        payments,
        meta: {
            page,
            limit,
            total,
            totalAmount,
        },
    };
};

export const paymentServices = {
    createPayment,
    confirmPayment,
    getPaymentById,
    getPaymentsByUser,
    // For admin
    getAllPayments,
    getPaymentTotals,
    getPaymentStatistics,
    // For Host
    getPaymentsByHost,
};
