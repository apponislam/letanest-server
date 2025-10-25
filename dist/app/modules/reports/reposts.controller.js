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
exports.reportControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const http_status_1 = __importDefault(require("http-status"));
const reports_services_1 = require("./reports.services");
const createReportController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const reportData = Object.assign(Object.assign({}, req.body), { guestId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
    const report = yield reports_services_1.reportServices.createReportService(reportData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Report submitted successfully",
        data: report,
    });
}));
const getMyReportsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const guestId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const reports = yield reports_services_1.reportServices.getReportsByGuestService(guestId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Your reports retrieved successfully",
        data: reports,
    });
}));
const getHostReportsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { hostId } = req.params;
    const reports = yield reports_services_1.reportServices.getReportsByHostService(hostId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Host reports retrieved successfully",
        data: reports,
    });
}));
const getAllReportsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status;
    const result = yield reports_services_1.reportServices.getAllReportsService(page, limit, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All reports retrieved successfully",
        data: result.reports,
        meta: result.meta,
    });
}));
const updateReportStatusController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reportId } = req.params;
    const { status } = req.body;
    const report = yield reports_services_1.reportServices.updateReportStatusService(reportId, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Report status updated successfully",
        data: report,
    });
}));
const getReportStatsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield reports_services_1.reportServices.getReportStatsService();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Report statistics retrieved successfully",
        data: stats,
    });
}));
exports.reportControllers = {
    createReportController,
    getMyReportsController,
    getHostReportsController,
    getAllReportsController,
    updateReportStatusController,
    getReportStatsController,
};
