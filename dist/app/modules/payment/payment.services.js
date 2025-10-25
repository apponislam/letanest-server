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
exports.paymentServices = void 0;
const mongoose_1 = require("mongoose");
const http_status_1 = __importDefault(require("http-status"));
const properties_model_1 = require("../property/properties.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const auth_model_1 = require("../auth/auth.model");
const stripe_services_1 = require("../subscription/stripe.services");
const payment_model_1 = require("./payment.model");
const message_services_1 = require("../messages/message.services");
const messages_model_1 = require("../messages/messages.model");
/**
 * Create a new payment
 */
const createPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Validate required fields
    if (!data.propertyId || !data.userId || !data.conversationId || !data.messageId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Missing required fields");
    }
    const message = yield messages_model_1.Message.findById(data.messageId);
    if ((message === null || message === void 0 ? void 0 : message.type) !== "offer") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Already payment done or cancelled");
    }
    if (data.totalAmount <= 0 || data.agreedFee <= 0) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid amount");
    }
    // Get host's Stripe account
    const property = yield properties_model_1.PropertyModel.findById(data.propertyId).populate("createdBy");
    if (!property) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Property not found");
    }
    const host = yield auth_model_1.UserModel.findById(property.createdBy);
    if (!((_a = host === null || host === void 0 ? void 0 : host.hostStripeAccount) === null || _a === void 0 ? void 0 : _a.stripeAccountId)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Host Stripe account not found");
    }
    // Get guest's Stripe customer
    const guest = yield auth_model_1.UserModel.findById(data.userId);
    if (!guest) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Guest user not found");
    }
    let stripeCustomerId = guest.stripeCustomerId;
    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
        try {
            // Create Stripe customer
            const stripeCustomer = yield stripe_services_1.stripeService.createCustomer2({
                email: guest.email,
                name: guest.name,
                metadata: {
                    userId: guest._id.toString(),
                },
            });
            stripeCustomerId = stripeCustomer.id;
            // Update user with Stripe customer ID
            yield auth_model_1.UserModel.findByIdAndUpdate(data.userId, {
                stripeCustomerId: stripeCustomerId,
            });
            console.log("✅ Created new Stripe customer:", stripeCustomerId);
        }
        catch (error) {
            console.error("Error creating Stripe customer:", error);
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create payment customer");
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
    const paymentIntent = yield stripe_services_1.stripeService.createConnectPayment(data.agreedFee, // Base amount for host + commission
    host.hostStripeAccount.stripeAccountId, stripeCustomerId, platformFees // Total platform fees
    );
    // Create payment record
    const payment = yield payment_model_1.PaymentModel.create({
        stripePaymentIntentId: paymentIntent.id,
        agreedFee: data.agreedFee,
        bookingFee: data.bookingFee,
        extraFee: data.extraFee || 0,
        totalAmount: data.totalAmount,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        hostAmount: hostAmount,
        platformTotal,
        userId: new mongoose_1.Types.ObjectId(data.userId),
        propertyId: new mongoose_1.Types.ObjectId(data.propertyId),
        conversationId: new mongoose_1.Types.ObjectId(data.conversationId),
        messageId: new mongoose_1.Types.ObjectId(data.messageId),
        hostId: new mongoose_1.Types.ObjectId(host._id),
        status: "pending",
        checkInDate: data.checkInDate || null,
        checkOutDate: data.checkOutDate || null,
    });
    return {
        payment,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
});
/**
 * Confirm payment
 */
const confirmPayment = (paymentIntentId, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!paymentIntentId || !paymentMethodId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Payment intent ID and payment method ID are required");
    }
    // Confirm payment with Stripe
    const paymentIntent = yield stripe_services_1.stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
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
    const payment = yield payment_model_1.PaymentModel.findOneAndUpdate({ stripePaymentIntentId: paymentIntentId }, {
        status: status,
        paidAt: paymentIntent.status === "succeeded" ? new Date() : undefined,
        stripePaymentStatus: paymentIntent.status,
    }, { new: true });
    if (!payment) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Payment record not found");
    }
    const updateAccept = yield message_services_1.messageServices.acceptOffer(payment.messageId.toString(), payment.conversationId.toString(), payment.userId.toString());
    console.log(updateAccept);
    return payment;
});
/**
 * Get payment by ID
 */
const getPaymentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid payment ID");
    }
    const payment = yield payment_model_1.PaymentModel.findById(id).populate("userId", "name email").populate("propertyId", "propertyNumber title").populate("conversationId").populate("messageId");
    if (!payment) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Payment not found");
    }
    return payment;
});
/**
 * Get payments by user ID (for guests)
 */
const getPaymentsByUser = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const [payments, total] = yield Promise.all([
        payment_model_1.PaymentModel.find({ userId: new mongoose_1.Types.ObjectId(userId) })
            .populate("hostId", "name email profileImg")
            .populate("propertyId", "title location coverPhoto propertyType amenities")
            .populate("messageId", "checkInDate checkOutDate") // Populate offer details
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        payment_model_1.PaymentModel.countDocuments({ userId: new mongoose_1.Types.ObjectId(userId) }),
    ]);
    return {
        payments,
        meta: {
            page,
            limit,
            total,
        },
    };
});
/**
 * Get all payments (for admin)
 */
const getAllPayments = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, options = {}) {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    // Build filter query
    const filterQuery = {};
    if (filters.status) {
        filterQuery.status = filters.status;
    }
    if (filters.propertyId) {
        filterQuery.propertyId = new mongoose_1.Types.ObjectId(filters.propertyId);
    }
    if (filters.userId) {
        filterQuery.userId = new mongoose_1.Types.ObjectId(filters.userId);
    }
    if (filters.startDate && filters.endDate) {
        filterQuery.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate),
        };
    }
    const payments = yield payment_model_1.PaymentModel.find(filterQuery)
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
    const total = yield payment_model_1.PaymentModel.countDocuments(filterQuery);
    return {
        payments,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
/**
 * Get payment totals and statistics
 */
const getPaymentTotals = () => __awaiter(void 0, void 0, void 0, function* () {
    const totals = yield payment_model_1.PaymentModel.aggregate([
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
});
/**
 * Get payment statistics (for admin dashboard)
 */
const getPaymentStatistics = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const totalPayments = yield payment_model_1.PaymentModel.countDocuments();
    const completedPayments = yield payment_model_1.PaymentModel.countDocuments({ status: "completed" });
    const pendingPayments = yield payment_model_1.PaymentModel.countDocuments({ status: "pending" });
    const failedPayments = yield payment_model_1.PaymentModel.countDocuments({ status: "failed" });
    const totalRevenue = yield payment_model_1.PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
    const platformRevenue = yield payment_model_1.PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$platformTotal" } } }]);
    const hostRevenue = yield payment_model_1.PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$hostAmount" } } }]);
    // Monthly revenue
    const monthlyRevenue = yield payment_model_1.PaymentModel.aggregate([
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
            total: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            platform: ((_b = platformRevenue[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
            host: ((_c = hostRevenue[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
        },
        monthly: monthlyRevenue,
    };
});
/**
 * Get payments by host ID
 */
const getPaymentsByHost = (hostId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const [payments, total, totalAmountResult] = yield Promise.all([
        payment_model_1.PaymentModel.find({ hostId: new mongoose_1.Types.ObjectId(hostId) })
            .populate("userId", "name email profileImg")
            .populate("propertyId", "title location coverPhoto propertyType")
            .populate("messageId", "checkInDate checkOutDate")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        payment_model_1.PaymentModel.countDocuments({ hostId: new mongoose_1.Types.ObjectId(hostId) }),
        // Calculate total hostAmount
        payment_model_1.PaymentModel.aggregate([
            {
                $match: {
                    hostId: new mongoose_1.Types.ObjectId(hostId),
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
});
exports.paymentServices = {
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
