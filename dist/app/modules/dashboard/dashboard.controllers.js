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
exports.dashboardControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const dashboard_services_1 = require("./dashboard.services");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const getDashboardStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield dashboard_services_1.dashboardServices.getDashboardStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: stats,
    });
}));
const getRevenueChartData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const chartData = yield dashboard_services_1.dashboardServices.getRevenueChartData(year);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Revenue chart data retrieved successfully",
        data: chartData,
    });
}));
// const getPropertyStatusStats = catchAsync(async (req: Request, res: Response) => {
//     const stats = await dashboardServices.getPropertyStatusStats();
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Property status statistics retrieved successfully",
//         data: stats,
//     });
// });
const getPropertyStatusStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { propertyType, startDate, endDate } = req.query;
    const filters = {};
    if (propertyType) {
        filters.propertyType = propertyType;
    }
    if (startDate) {
        filters.startDate = new Date(startDate);
    }
    if (endDate) {
        filters.endDate = new Date(endDate);
    }
    const stats = yield dashboard_services_1.dashboardServices.getPropertyStatusStats(filters);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Property status statistics retrieved successfully",
        data: stats,
    });
}));
const getSiteStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const analytics = yield dashboard_services_1.dashboardServices.getSiteStatsService();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Property analytics retrieved successfully",
        data: analytics,
    });
}));
const getHostStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const stats = yield dashboard_services_1.dashboardServices.getHostStats(req.user._id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Host statistics retrieved successfully",
        data: stats,
    });
}));
exports.dashboardControllers = {
    getDashboardStats,
    getRevenueChartData,
    getPropertyStatusStats,
    getSiteStats,
    getHostStats,
};
