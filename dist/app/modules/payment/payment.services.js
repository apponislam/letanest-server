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
const calculateCommission_1 = require("./calculateCommission");
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
            const stripeCustomer = yield stripe_services_1.stripeService.createCustomer2({
                email: guest.email,
                name: guest.name,
                metadata: {
                    userId: guest._id.toString(),
                },
            });
            stripeCustomerId = stripeCustomer.id;
            yield auth_model_1.UserModel.findByIdAndUpdate(data.userId, {
                stripeCustomerId: stripeCustomerId,
            });
        }
        catch (error) {
            console.error("Error creating Stripe customer:", error);
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create payment customer");
        }
    }
    // Calculate commission
    const commissionResult = yield (0, calculateCommission_1.calculateCommission)(host._id.toString(), data.agreedFee);
    // Check if booking fee AND extra fee were already paid
    const isBookingFeeAlreadyPaid = message.bookingFeePaid === true;
    const isExtraFeeAlreadyPaid = message.extraFeePaid === true;
    // ✅ GET THE ACTUAL EXTRA FEE AMOUNT (from message or data)
    const actualExtraFee = message.extraFee || data.extraFee || 0;
    // ✅ CORRECT: ALWAYS include ALL amounts in database storage
    const totalAmount = data.agreedFee + data.bookingFee + actualExtraFee;
    const platformTotal = commissionResult.commissionAmount + data.bookingFee + actualExtraFee;
    const hostAmount = data.agreedFee - commissionResult.commissionAmount;
    // ✅ CORRECT: Only exclude from Stripe payment amount
    const stripePaymentAmount = data.agreedFee + (isBookingFeeAlreadyPaid ? 0 : data.bookingFee) + (isExtraFeeAlreadyPaid ? 0 : actualExtraFee);
    const stripePlatformTotal = commissionResult.commissionAmount + (isBookingFeeAlreadyPaid ? 0 : data.bookingFee) + (isExtraFeeAlreadyPaid ? 0 : actualExtraFee);
    // Check if there's an existing booking fee payment
    const existingBookingFeePayment = yield payment_model_1.PaymentModel.findOne({
        messageId: data.messageId,
        isBookingFeePaidOnly: true,
    });
    // Create Stripe Connect payment
    const paymentIntent = yield stripe_services_1.stripeService.createConnectPayment(stripePaymentAmount, host.hostStripeAccount.stripeAccountId, stripeCustomerId, stripePlatformTotal);
    let payment;
    if (existingBookingFeePayment) {
        // UPDATE existing booking fee payment
        payment = yield payment_model_1.PaymentModel.findOneAndUpdate({
            messageId: data.messageId,
            isBookingFeePaidOnly: true,
        }, {
            $set: {
                stripePaymentIntentId: paymentIntent.id,
                agreedFee: data.agreedFee,
                bookingFee: data.bookingFee,
                extraFee: actualExtraFee,
                totalAmount: totalAmount,
                commissionRate: commissionResult.commissionRate,
                commissionAmount: commissionResult.commissionAmount,
                hostAmount: hostAmount,
                platformTotal: platformTotal,
                status: "pending",
                paymentType: "Stripe",
                checkInDate: data.checkInDate || null,
                checkOutDate: data.checkOutDate || null,
                usedFreeBooking: commissionResult.usedFreeBooking,
                isBookingFeePaidOnly: false,
                bookingFeePaidDone: data.bookingFee,
                extraFeePaid: isExtraFeeAlreadyPaid,
                commissionPaid: true,
                comissionPaidDone: commissionResult.commissionAmount,
            },
        }, { new: true });
    }
    else {
        // Create new payment record
        payment = yield payment_model_1.PaymentModel.create({
            stripePaymentIntentId: paymentIntent.id,
            agreedFee: data.agreedFee,
            bookingFee: data.bookingFee,
            extraFee: actualExtraFee,
            totalAmount: totalAmount,
            commissionRate: commissionResult.commissionRate,
            commissionAmount: commissionResult.commissionAmount,
            hostAmount: hostAmount,
            platformTotal: platformTotal,
            userId: new mongoose_1.Types.ObjectId(data.userId),
            propertyId: new mongoose_1.Types.ObjectId(data.propertyId),
            conversationId: new mongoose_1.Types.ObjectId(data.conversationId),
            messageId: new mongoose_1.Types.ObjectId(data.messageId),
            hostId: new mongoose_1.Types.ObjectId(host._id),
            status: "pending",
            paymentType: "Stripe",
            checkInDate: data.checkInDate || null,
            checkOutDate: data.checkOutDate || null,
            usedFreeBooking: commissionResult.usedFreeBooking,
            isBookingFeePaidOnly: false,
            bookingFeePaidDone: isBookingFeeAlreadyPaid ? data.bookingFee : 0,
            extraFeePaid: isExtraFeeAlreadyPaid,
            commissionPaid: true,
            comissionPaidDone: commissionResult.commissionAmount,
            createdAt: new Date(),
        });
    }
    if (!payment) {
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create or update payment");
    }
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
    yield message_services_1.messageServices.acceptOffer(payment.messageId.toString(), payment.conversationId.toString(), payment.userId.toString());
    return payment;
});
/**
 * Create a new booking fee payment
 */
const createBookingFeePayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate required fields
    if (!data.propertyId || !data.userId || !data.conversationId || !data.messageId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Missing required fields");
    }
    const message = yield messages_model_1.Message.findById(data.messageId);
    if ((message === null || message === void 0 ? void 0 : message.type) !== "offer") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Already payment done or cancelled");
    }
    if (data.bookingFee < 0) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid booking fee amount");
    }
    // Get property details
    const property = yield properties_model_1.PropertyModel.findById(data.propertyId).populate("createdBy");
    if (!property) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Property not found");
    }
    const host = yield auth_model_1.UserModel.findById(property.createdBy);
    if (!host) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Host not found");
    }
    // Calculate commission
    const commissionResult = yield (0, calculateCommission_1.calculateCommission)(host._id.toString(), data.agreedFee);
    // ✅ IDENTICAL CALCULATIONS AS createPayment:
    const totalAmount = data.agreedFee + data.bookingFee + (data.extraFee || 0);
    const platformTotal = commissionResult.commissionAmount + data.bookingFee + (data.extraFee || 0);
    const hostAmount = data.agreedFee - commissionResult.commissionAmount;
    // Amount to actually charge in Stripe (booking fee + extra fee only)
    const amountToCharge = data.bookingFee + (data.extraFee || 0);
    // If total amount to charge is 0, mark as paid immediately without Stripe
    if (amountToCharge === 0) {
        console.log("✅ Total amount is 0 - marking as paid without payment");
        // Create payment record with IDENTICAL DATA as main payment
        const payment = yield payment_model_1.PaymentModel.create({
            stripePaymentIntentId: "free_booking_fee_" + Date.now(),
            agreedFee: data.agreedFee,
            bookingFee: data.bookingFee,
            extraFee: data.extraFee || 0,
            totalAmount: totalAmount,
            commissionRate: commissionResult.commissionRate,
            commissionAmount: commissionResult.commissionAmount,
            hostAmount: hostAmount,
            platformTotal: platformTotal,
            userId: new mongoose_1.Types.ObjectId(data.userId),
            propertyId: new mongoose_1.Types.ObjectId(data.propertyId),
            conversationId: new mongoose_1.Types.ObjectId(data.conversationId),
            messageId: new mongoose_1.Types.ObjectId(data.messageId),
            hostId: new mongoose_1.Types.ObjectId(property.createdBy._id),
            status: "completed",
            paymentType: "Bank",
            checkInDate: data.checkInDate || null,
            checkOutDate: data.checkOutDate || null,
            usedFreeBooking: commissionResult.usedFreeBooking,
            isBookingFeePaidOnly: true,
            bookingFeePaidDone: data.bookingFee || 0,
            extraFeePaid: data.extraFee && data.extraFee > 0 ? true : false,
            commissionPaid: false,
            comissionPaidDone: 0,
            paidAt: new Date(),
            createdAt: new Date(),
        });
        // ✅ FIXED: ALWAYS save extraFee to message (even if 0)
        const updateData = {
            bookingFeePaid: true,
            extraFee: data.extraFee || 0, // ✅ ALWAYS save extra fee amount
        };
        if (data.extraFee && data.extraFee > 0) {
            updateData.extraFeePaid = true;
        }
        yield messages_model_1.Message.findByIdAndUpdate(data.messageId, updateData);
        console.log("✅ Free booking fee payment record created:", payment._id);
        return {
            payment,
            clientSecret: null,
            paymentIntentId: payment.stripePaymentIntentId,
        };
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
            const stripeCustomer = yield stripe_services_1.stripeService.createCustomer2({
                email: guest.email,
                name: guest.name,
                metadata: {
                    userId: guest._id.toString(),
                },
            });
            stripeCustomerId = stripeCustomer.id;
            yield auth_model_1.UserModel.findByIdAndUpdate(data.userId, {
                stripeCustomerId: stripeCustomerId,
            });
        }
        catch (error) {
            console.error("Error creating Stripe customer:", error);
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create payment customer");
        }
    }
    // Use createBookingFeePayment to charge only booking fee + extra fee
    const paymentIntent = yield stripe_services_1.stripeService.createBookingFeePayment(amountToCharge, stripeCustomerId);
    // Create payment record with IDENTICAL DATA as main payment
    const payment = yield payment_model_1.PaymentModel.create({
        stripePaymentIntentId: paymentIntent.id,
        agreedFee: data.agreedFee,
        bookingFee: data.bookingFee,
        extraFee: data.extraFee || 0,
        totalAmount: totalAmount,
        commissionRate: commissionResult.commissionRate,
        commissionAmount: commissionResult.commissionAmount,
        hostAmount: hostAmount,
        platformTotal: platformTotal,
        userId: new mongoose_1.Types.ObjectId(data.userId),
        propertyId: new mongoose_1.Types.ObjectId(data.propertyId),
        conversationId: new mongoose_1.Types.ObjectId(data.conversationId),
        messageId: new mongoose_1.Types.ObjectId(data.messageId),
        hostId: new mongoose_1.Types.ObjectId(host._id),
        status: "pending",
        paymentType: "Bank",
        checkInDate: data.checkInDate || null,
        checkOutDate: data.checkOutDate || null,
        usedFreeBooking: commissionResult.usedFreeBooking,
        isBookingFeePaidOnly: true,
        bookingFeePaidDone: 0,
        extraFeePaid: data.extraFee && data.extraFee > 0 ? false : undefined,
        commissionPaid: false,
        comissionPaidDone: 0,
        createdAt: new Date(),
    });
    // ✅ FIXED: ALWAYS save extraFee to message for pending payments too
    const messageUpdateData = {
        extraFee: data.extraFee || 0, // ✅ ALWAYS save extra fee amount
    };
    if (data.extraFee && data.extraFee > 0) {
        messageUpdateData.extraFeePaid = false; // Not paid yet for pending payments
    }
    yield messages_model_1.Message.findByIdAndUpdate(data.messageId, messageUpdateData);
    console.log("✅ createBookingFeePayment Record Created:", payment);
    return {
        payment,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
});
/**
 * Confirm booking fee payment
 */
const confirmBookingFeePayment = (paymentIntentId, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!paymentIntentId || !paymentMethodId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Payment intent ID and payment method ID are required");
    }
    // Skip confirmation if it's a free booking fee
    if (paymentIntentId.startsWith("free_booking_fee")) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Free booking fee does not require confirmation");
    }
    // First, get the payment record to access bookingFee
    const existingPayment = yield payment_model_1.PaymentModel.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!existingPayment) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Payment record not found");
    }
    // ✅ FIXED: Use confirmBookingFeePayment instead of confirmPaymentIntent
    const paymentIntent = yield stripe_services_1.stripeService.confirmBookingFeePayment(paymentIntentId, paymentMethodId);
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
        bookingFeePaidDone: paymentIntent.status === "succeeded" ? existingPayment.bookingFee : 0,
    }, { new: true });
    if (!payment) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Payment record not found");
    }
    // Update message bookingFeePaid status when payment succeeds
    if (paymentIntent.status === "succeeded") {
        const updateData = {
            bookingFeePaid: true,
        };
        // If there's an extra fee in the payment, mark it as paid too
        if (existingPayment.extraFee && existingPayment.extraFee > 0) {
            updateData.extraFee = existingPayment.extraFee;
            updateData.extraFeePaid = true;
        }
        yield messages_model_1.Message.findByIdAndUpdate(payment.messageId, updateData);
    }
    yield message_services_1.messageServices.updateBookingFeePaid(payment.messageId.toString(), payment.conversationId.toString(), payment.userId.toString());
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
    const search = filters.search || options.search;
    const skip = (page - 1) * limit;
    // If no search, use the simple approach
    if (!search) {
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
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
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
            },
        };
    }
    // If search exists, use aggregation
    const aggregationPipeline = [
        // Lookup user (guest)
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userId",
            },
        },
        { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
        // Lookup property
        {
            $lookup: {
                from: "properties",
                localField: "propertyId",
                foreignField: "_id",
                as: "propertyId",
            },
        },
        { $unwind: { path: "$propertyId", preserveNullAndEmptyArrays: true } },
        // Lookup property creator (host)
        {
            $lookup: {
                from: "users",
                localField: "propertyId.createdBy",
                foreignField: "_id",
                as: "propertyCreatedBy",
            },
        },
        { $unwind: { path: "$propertyCreatedBy", preserveNullAndEmptyArrays: true } },
        // Search across all fields
        {
            $match: {
                $or: [
                    { stripePaymentIntentId: { $regex: search, $options: "i" } },
                    { "userId.name": { $regex: search, $options: "i" } }, // Guest name
                    { "propertyCreatedBy.name": { $regex: search, $options: "i" } }, // Host name
                    { "propertyId.title": { $regex: search, $options: "i" } }, // Property title
                ],
            },
        },
    ];
    // Add other filters
    const matchStage = {};
    if (filters.status)
        matchStage.status = filters.status;
    if (filters.propertyId)
        matchStage.propertyId = new mongoose_1.Types.ObjectId(filters.propertyId);
    if (filters.userId)
        matchStage.userId = new mongoose_1.Types.ObjectId(filters.userId);
    if (filters.startDate && filters.endDate) {
        matchStage.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate),
        };
    }
    if (Object.keys(matchStage).length > 0) {
        aggregationPipeline.push({ $match: matchStage });
    }
    // Count total
    const countPipeline = [...aggregationPipeline, { $count: "total" }];
    // Get data with pagination and project to match your frontend structure
    aggregationPipeline.push({ $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } });
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });
    // Project to match your frontend expected structure
    aggregationPipeline.push({
        $project: {
            _id: 1,
            stripePaymentIntentId: 1,
            agreedFee: 1,
            bookingFee: 1,
            extraFee: 1,
            totalAmount: 1,
            commissionRate: 1,
            commissionAmount: 1,
            hostAmount: 1,
            platformTotal: 1,
            checkInDate: 1,
            checkOutDate: 1,
            userId: {
                _id: "$userId._id",
                name: "$userId.name",
                email: "$userId.email",
                phone: "$userId.phone",
            },
            propertyId: {
                _id: "$propertyId._id",
                propertyNumber: "$propertyId.propertyNumber",
                title: "$propertyId.title",
                address: "$propertyId.address",
                createdBy: {
                    _id: "$propertyCreatedBy._id",
                    name: "$propertyCreatedBy.name",
                },
            },
            conversationId: 1,
            messageId: 1,
            hostId: 1,
            status: 1,
            stripePaymentStatus: 1,
            createdAt: 1,
            paidAt: 1,
        },
    });
    console.log("Search term:", search);
    console.log("Aggregation Pipeline:", JSON.stringify(aggregationPipeline, null, 2));
    const [payments, totalResult] = yield Promise.all([payment_model_1.PaymentModel.aggregate(aggregationPipeline), payment_model_1.PaymentModel.aggregate(countPipeline)]);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
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
    const search = query.search;
    // If no search, use simple approach
    if (!search) {
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
                        status: "completed",
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
    }
    // If search exists, use aggregation
    const aggregationPipeline = [
        {
            $match: {
                hostId: new mongoose_1.Types.ObjectId(hostId),
            },
        },
        // Lookup user (guest)
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userId",
            },
        },
        { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
        // Lookup property
        {
            $lookup: {
                from: "properties",
                localField: "propertyId",
                foreignField: "_id",
                as: "propertyId",
            },
        },
        { $unwind: { path: "$propertyId", preserveNullAndEmptyArrays: true } },
        // Lookup message
        {
            $lookup: {
                from: "messages",
                localField: "messageId",
                foreignField: "_id",
                as: "messageId",
            },
        },
        { $unwind: { path: "$messageId", preserveNullAndEmptyArrays: true } },
        // Search across all fields
        {
            $match: {
                $or: [
                    { stripePaymentIntentId: { $regex: search, $options: "i" } },
                    { "userId.name": { $regex: search, $options: "i" } }, // Guest name
                    { "propertyId.title": { $regex: search, $options: "i" } }, // Property title
                ],
            },
        },
    ];
    // Count total
    const countPipeline = [...aggregationPipeline, { $count: "total" }];
    // Get data with pagination
    aggregationPipeline.push({ $sort: { createdAt: -1 } });
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });
    // Project to match frontend structure
    aggregationPipeline.push({
        $project: {
            _id: 1,
            stripePaymentIntentId: 1,
            agreedFee: 1,
            bookingFee: 1,
            extraFee: 1,
            totalAmount: 1,
            commissionRate: 1,
            commissionAmount: 1,
            hostAmount: 1,
            platformTotal: 1,
            checkInDate: 1,
            checkOutDate: 1,
            status: 1,
            stripePaymentStatus: 1,
            createdAt: 1,
            paidAt: 1,
            userId: {
                _id: "$userId._id",
                name: "$userId.name",
                email: "$userId.email",
                profileImg: "$userId.profileImg",
            },
            propertyId: {
                _id: "$propertyId._id",
                title: "$propertyId.title",
                location: "$propertyId.location",
                coverPhoto: "$propertyId.coverPhoto",
                propertyType: "$propertyId.propertyType",
            },
            messageId: {
                _id: "$messageId._id",
                checkInDate: "$messageId.checkInDate",
                checkOutDate: "$messageId.checkOutDate",
            },
        },
    });
    // Calculate total amount for completed payments
    const totalAmountPipeline = [
        {
            $match: {
                hostId: new mongoose_1.Types.ObjectId(hostId),
                status: "completed",
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$hostAmount" },
            },
        },
    ];
    const [payments, totalResult, totalAmountResult] = yield Promise.all([payment_model_1.PaymentModel.aggregate(aggregationPipeline), payment_model_1.PaymentModel.aggregate(countPipeline), payment_model_1.PaymentModel.aggregate(totalAmountPipeline)]);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
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
const getPaymentsByProperty = (propertyId, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(propertyId)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid property ID");
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    // Always filter by completed status
    const filterQuery = {
        propertyId: new mongoose_1.Types.ObjectId(propertyId),
        status: "completed",
    };
    // If search term provided, use aggregation to search by guest name
    if (query.search) {
        const aggregationPipeline = [
            {
                $match: {
                    propertyId: new mongoose_1.Types.ObjectId(propertyId),
                    status: "completed",
                },
            },
            // Lookup user (guest)
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userId",
                },
            },
            { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
            // Search by guest name
            {
                $match: {
                    "userId.name": { $regex: query.search, $options: "i" },
                },
            },
            // Lookup other fields
            {
                $lookup: {
                    from: "properties",
                    localField: "propertyId",
                    foreignField: "_id",
                    as: "propertyId",
                },
            },
            { $unwind: { path: "$propertyId", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "messages",
                    localField: "messageId",
                    foreignField: "_id",
                    as: "messageId",
                },
            },
            { $unwind: { path: "$messageId", preserveNullAndEmptyArrays: true } },
            // Sort and paginate
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Project final structure
            {
                $project: {
                    _id: 1,
                    stripePaymentIntentId: 1,
                    agreedFee: 1,
                    bookingFee: 1,
                    extraFee: 1,
                    totalAmount: 1,
                    commissionRate: 1,
                    commissionAmount: 1,
                    hostAmount: 1,
                    platformTotal: 1,
                    checkInDate: 1,
                    checkOutDate: 1,
                    status: 1,
                    stripePaymentStatus: 1,
                    createdAt: 1,
                    paidAt: 1,
                    userId: {
                        _id: "$userId._id",
                        name: "$userId.name",
                        email: "$userId.email",
                        profileImg: "$userId.profileImg",
                        phone: "$userId.phone",
                    },
                    propertyId: {
                        _id: "$propertyId._id",
                        title: "$propertyId.title",
                        propertyNumber: "$propertyId.propertyNumber",
                        coverPhoto: "$propertyId.coverPhoto",
                        address: "$propertyId.address",
                        location: "$propertyId.location",
                    },
                    messageId: {
                        _id: "$messageId._id",
                        checkInDate: "$messageId.checkInDate",
                        checkOutDate: "$messageId.checkOutDate",
                        guestNo: "$messageId.guestNo",
                    },
                },
            },
        ];
        const [payments, totalResult] = yield Promise.all([payment_model_1.PaymentModel.aggregate(aggregationPipeline), payment_model_1.PaymentModel.aggregate([...aggregationPipeline.slice(0, -4), { $count: "total" }])]);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;
        return {
            payments,
            meta: {
                page,
                limit,
                total,
            },
        };
    }
    // Simple query without search
    const [payments, total] = yield Promise.all([payment_model_1.PaymentModel.find(filterQuery).populate("userId", "name email profileImg phone").populate("propertyId", "title propertyNumber coverPhoto address location").populate("messageId", "checkInDate checkOutDate guestNo").sort({ createdAt: -1 }).skip(skip).limit(limit), payment_model_1.PaymentModel.countDocuments(filterQuery)]);
    return {
        payments,
        meta: {
            page,
            limit,
            total,
        },
    };
});
exports.paymentServices = {
    createPayment,
    confirmPayment,
    // Booking Fee Payment
    createBookingFeePayment,
    confirmBookingFeePayment,
    getPaymentById,
    getPaymentsByUser,
    // For admin
    getAllPayments,
    getPaymentTotals,
    getPaymentStatistics,
    // For Host
    getPaymentsByHost,
    // Get payment by property
    getPaymentsByProperty,
};
