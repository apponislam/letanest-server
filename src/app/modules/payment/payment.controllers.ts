import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import { paymentServices } from "./payment.services";
import sendResponse from "../../../utils/sendResponse.";
import ApiError from "../../../errors/ApiError";

const createPayment = catchAsync(async (req: Request, res: Response) => {
    const paymentData = {
        ...req.body,
        userId: req.user?._id,
    };

    const result = await paymentServices.createPayment(paymentData);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Payment created successfully",
        data: result,
    });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Payment intent ID and payment method ID are required");
    }

    const payment = await paymentServices.confirmPayment(paymentIntentId, paymentMethodId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment confirmed successfully",
        data: payment,
    });
});

const getPayment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const payment = await paymentServices.getPaymentById(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment retrieved successfully",
        data: payment,
    });
});

const getUserPayments = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    const result = await paymentServices.getPaymentsByUser(userId, {
        page: Number(page),
        limit: Number(limit),
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User payments retrieved successfully",
        data: result.payments,
        meta: result.meta,
    });
});

/**
 * Get all payments (admin only)
 */
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
    const filters = {
        status: req.query.status as string,
        propertyId: req.query.propertyId as string,
        userId: req.query.userId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
    };
    console.log(filters);

    const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as string) || "desc",
    };
    console.log(options);

    const result = await paymentServices.getAllPayments(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All payments retrieved successfully",
        data: result.payments,
        meta: result.meta,
    });
});

/**
 * Get payment totals (admin only)
 */
const getPaymentTotals = catchAsync(async (req: Request, res: Response) => {
    const totals = await paymentServices.getPaymentTotals();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment totals retrieved successfully",
        data: totals,
    });
});

/**
 * Get payment statistics (admin only)
 */
const getPaymentStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await paymentServices.getPaymentStatistics();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment statistics retrieved successfully",
        data: stats,
    });
});

/**
 * Get payments by host (host only)
 */
const getHostPayments = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    const result = await paymentServices.getPaymentsByHost(hostId, {
        page: Number(page),
        limit: Number(limit),
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host payments retrieved successfully",
        data: result.payments,
        meta: result.meta,
    });
});

export const paymentControllers = {
    createPayment,
    confirmPayment,
    getPayment,
    getUserPayments,
    // For admin
    getAllPayments,
    getPaymentTotals,
    getPaymentStats,
    // For Host
    getHostPayments,
};
