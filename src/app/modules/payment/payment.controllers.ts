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

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const payments = await paymentServices.getPaymentsByUser(userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payments retrieved successfully",
        data: payments,
    });
});

export const paymentControllers = {
    createPayment,
    confirmPayment,
    getPayment,
    getMyPayments,
};
