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
exports.paymentMethodControllers = void 0;
// controllers/paymentMethod.controller.ts
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const paymentMethod_services_1 = require("./paymentMethod.services");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
/**
 * Create a new payment method
 */
const createPaymentMethod = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentMethodId, isDefault = false } = req.body;
    const userId = req.user._id;
    if (!paymentMethodId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Payment method ID is required");
    }
    // The service will handle creating Stripe customer and getting card details
    const paymentMethod = yield paymentMethod_services_1.paymentMethodServices.createPaymentMethod({
        userId,
        paymentMethodId,
        isDefault,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Payment method added successfully",
        data: paymentMethod,
    });
}));
/**
 * Get user's payment methods
 */
const getPaymentMethods = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentMethods = yield paymentMethod_services_1.paymentMethodServices.getPaymentMethodsByUserId(req.user._id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment methods retrieved successfully",
        data: paymentMethods,
    });
}));
/**
 * Set payment method as default
 */
const setDefaultPaymentMethod = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentMethodId } = req.params;
    // Validate ownership
    const isOwner = yield paymentMethod_services_1.paymentMethodServices.validatePaymentMethodOwnership(req.user._id, paymentMethodId);
    if (!isOwner) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to modify this payment method");
    }
    const paymentMethod = yield paymentMethod_services_1.paymentMethodServices.setDefaultPaymentMethod(req.user._id, paymentMethodId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment method set as default successfully",
        data: paymentMethod,
    });
}));
/**
 * Delete payment method
 */
const deletePaymentMethod = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentMethodId } = req.params;
    // Validate ownership
    const isOwner = yield paymentMethod_services_1.paymentMethodServices.validatePaymentMethodOwnership(req.user._id, paymentMethodId);
    if (!isOwner) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to delete this payment method");
    }
    yield paymentMethod_services_1.paymentMethodServices.deletePaymentMethod(req.user._id, paymentMethodId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment method deleted successfully",
        data: null,
    });
}));
/**
 * Get default payment method
 */
const getDefaultPaymentMethod = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentMethod = yield paymentMethod_services_1.paymentMethodServices.getDefaultPaymentMethod(req.user._id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: paymentMethod ? "Default payment method retrieved successfully" : "No default payment method found",
        data: paymentMethod,
    });
}));
exports.paymentMethodControllers = {
    createPaymentMethod,
    getPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    getDefaultPaymentMethod,
};
