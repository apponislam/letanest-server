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
exports.paymentControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const payment_services_1 = require("./payment.services");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const paymentData = Object.assign(Object.assign({}, req.body), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
    const result = yield payment_services_1.paymentServices.createPayment(paymentData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Payment created successfully",
        data: result,
    });
}));
const confirmPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentIntentId, paymentMethodId } = req.body;
    if (!paymentIntentId || !paymentMethodId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Payment intent ID and payment method ID are required");
    }
    const payment = yield payment_services_1.paymentServices.confirmPayment(paymentIntentId, paymentMethodId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment confirmed successfully",
        data: payment,
    });
}));
const getPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const payment = yield payment_services_1.paymentServices.getPaymentById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment retrieved successfully",
        data: payment,
    });
}));
const getUserPayments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { page = 1, limit = 10 } = req.query;
    const result = yield payment_services_1.paymentServices.getPaymentsByUser(userId, {
        page: Number(page),
        limit: Number(limit),
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User payments retrieved successfully",
        data: result.payments,
        meta: result.meta,
    });
}));
/**
 * Get all payments (admin only)
 */
const getAllPayments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = {
        status: req.query.status,
        propertyId: req.query.propertyId,
        userId: req.query.userId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
    };
    console.log(filters);
    const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
    };
    console.log(options);
    const result = yield payment_services_1.paymentServices.getAllPayments(filters, options);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All payments retrieved successfully",
        data: result.payments,
        meta: result.meta,
    });
}));
/**
 * Get payment totals (admin only)
 */
const getPaymentTotals = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const totals = yield payment_services_1.paymentServices.getPaymentTotals();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment totals retrieved successfully",
        data: totals,
    });
}));
/**
 * Get payment statistics (admin only)
 */
const getPaymentStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield payment_services_1.paymentServices.getPaymentStatistics();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment statistics retrieved successfully",
        data: stats,
    });
}));
/**
 * Get payments by host (host only)
 */
const getHostPayments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hostId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { page = 1, limit = 10 } = req.query;
    const result = yield payment_services_1.paymentServices.getPaymentsByHost(hostId, {
        page: Number(page),
        limit: Number(limit),
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Host payments retrieved successfully",
        data: result.payments,
        meta: result.meta,
    });
}));
// /**
//  * Download payments PDF (admin only)
//  */
// const downloadPaymentsPDF = catchAsync(async (req: Request, res: Response) => {
//     const { fromDate, toDate } = req.body;
//     // Validate dates
//     if (!fromDate || !toDate) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Both fromDate and toDate are required");
//     }
//     // Validate date format
//     const from = new Date(fromDate);
//     const to = new Date(toDate);
//     if (isNaN(from.getTime()) || isNaN(to.getTime())) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
//     }
//     if (from > to) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "fromDate cannot be after toDate");
//     }
//     // Generate PDF
//     const pdfBuffer = await paymentServices.generatePaymentsPDF(fromDate, toDate);
//     // Set response headers for PDF download
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=transactions-${fromDate}-to-${toDate}.pdf`);
//     res.setHeader("Content-Length", pdfBuffer.length);
//     // Send PDF
//     res.send(pdfBuffer);
// });
exports.paymentControllers = {
    createPayment,
    confirmPayment,
    getPayment,
    getUserPayments,
    // For admin
    getAllPayments,
    getPaymentTotals,
    getPaymentStats,
    // downloadPaymentsPDF,
    // For Host
    getHostPayments,
};
