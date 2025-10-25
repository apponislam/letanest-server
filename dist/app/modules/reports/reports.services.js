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
exports.reportServices = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const reports_model_1 = require("./reports.model");
const createReportService = (reportData) => __awaiter(void 0, void 0, void 0, function* () {
    const report = yield reports_model_1.ReportModel.create(reportData);
    return report;
});
const getReportsByHostService = (hostId) => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield reports_model_1.ReportModel.find({ hostId }).populate("guestId", "name email profileImg").sort({ createdAt: -1 });
    return reports;
});
const getReportsByGuestService = (guestId) => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield reports_model_1.ReportModel.find({ guestId }).populate("hostId", "name email profileImg").sort({ createdAt: -1 });
    return reports;
});
const getAllReportsService = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10, status) {
    const skip = (page - 1) * limit;
    // Build query
    const query = {};
    if (status) {
        query.status = status;
    }
    const [reports, total] = yield Promise.all([reports_model_1.ReportModel.find(query).populate("guestId", "name email profileImg").populate("hostId", "name email profileImg").sort({ createdAt: -1 }).skip(skip).limit(limit), reports_model_1.ReportModel.countDocuments(query)]);
    return {
        reports,
        meta: {
            page,
            limit,
            total,
        },
    };
});
const updateReportStatusService = (reportId, status) => __awaiter(void 0, void 0, void 0, function* () {
    const report = yield reports_model_1.ReportModel.findByIdAndUpdate(reportId, { status }, { new: true }).populate("guestId", "name email profileImg").populate("hostId", "name email profileImg");
    if (!report) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Report not found");
    }
    return report;
});
const getReportStatsService = () => __awaiter(void 0, void 0, void 0, function* () {
    const [total, pending, resolved] = yield Promise.all([reports_model_1.ReportModel.countDocuments(), reports_model_1.ReportModel.countDocuments({ status: "pending" }), reports_model_1.ReportModel.countDocuments({ status: "resolved" })]);
    return {
        total,
        pending,
        resolved,
    };
});
exports.reportServices = {
    createReportService,
    getReportsByHostService,
    getReportsByGuestService,
    getAllReportsService,
    updateReportStatusService,
    getReportStatsService,
};
