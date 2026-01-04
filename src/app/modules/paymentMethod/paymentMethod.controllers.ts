// controllers/paymentMethod.controller.ts
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import { paymentMethodServices } from "./paymentMethod.services";
import ApiError from "../../../errors/ApiError";
import sendResponse from "../../../utils/sendResponse.";

/**
 * Create a new payment method
 */
const createPaymentMethod = catchAsync(async (req, res) => {
    const { paymentMethodId, isDefault = false } = req.body;
    const userId = req.user._id;

    if (!paymentMethodId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Payment method ID is required");
    }

    // The service will handle creating Stripe customer and getting card details
    const paymentMethod = await paymentMethodServices.createPaymentMethod({
        userId,
        paymentMethodId,
        isDefault,
    } as any);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Payment method added successfully",
        data: paymentMethod,
    });
});

/**
 * Get user's payment methods
 */
const getPaymentMethods = catchAsync(async (req, res) => {
    const paymentMethods = await paymentMethodServices.getPaymentMethodsByUserId(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment methods retrieved successfully",
        data: paymentMethods,
    });
});

/**
 * Set payment method as default
 */
const setDefaultPaymentMethod = catchAsync(async (req, res) => {
    const { paymentMethodId } = req.params;

    // Validate ownership
    const isOwner = await paymentMethodServices.validatePaymentMethodOwnership(req.user._id, paymentMethodId);
    if (!isOwner) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to modify this payment method");
    }

    const paymentMethod = await paymentMethodServices.setDefaultPaymentMethod(req.user._id, paymentMethodId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment method set as default successfully",
        data: paymentMethod,
    });
});

/**
 * Delete payment method
 */
const deletePaymentMethod = catchAsync(async (req, res) => {
    const { paymentMethodId } = req.params;

    // Validate ownership
    const isOwner = await paymentMethodServices.validatePaymentMethodOwnership(req.user._id, paymentMethodId);
    if (!isOwner) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to delete this payment method");
    }

    await paymentMethodServices.deletePaymentMethod(req.user._id, paymentMethodId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment method deleted successfully",
        data: null,
    });
});

/**
 * Get default payment method
 */
const getDefaultPaymentMethod = catchAsync(async (req, res) => {
    const paymentMethod = await paymentMethodServices.getDefaultPaymentMethod(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: paymentMethod ? "Default payment method retrieved successfully" : "No default payment method found",
        data: paymentMethod,
    });
});

export const paymentMethodControllers = {
    createPaymentMethod,
    getPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    getDefaultPaymentMethod,
};
