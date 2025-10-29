import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import httpStatus from "http-status";
import { reportServices } from "./reports.services";

const createReportController = catchAsync(async (req: Request, res: Response) => {
    const reportData = {
        ...req.body,
        reporterId: req.user?._id, // Changed from guestId to reporterId
    };

    const report = await reportServices.createReportService(reportData);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Report submitted successfully",
        data: report,
    });
});

const getMyReportsController = catchAsync(async (req: Request, res: Response) => {
    const reporterId = req.user?._id; // Changed from guestId to reporterId
    const reports = await reportServices.getReportsByReporterService(reporterId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your reports retrieved successfully",
        data: reports,
    });
});

const getReportsAgainstMeController = catchAsync(async (req: Request, res: Response) => {
    const reportedUserId = req.user?._id; // Changed from hostId to reportedUserId
    const reports = await reportServices.getReportsAgainstUserService(reportedUserId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reports against you retrieved successfully",
        data: reports,
    });
});

const getAllReportsController = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as "pending" | "resolved" | "dismissed" | undefined;

    const result = await reportServices.getAllReportsService(page, limit, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All reports retrieved successfully",
        data: result.reports,
        meta: result.meta,
    });
});

const updateReportStatusController = catchAsync(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { status } = req.body;

    const report = await reportServices.updateReportStatusService(reportId, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Report status updated successfully",
        data: report,
    });
});

const getReportStatsController = catchAsync(async (req: Request, res: Response) => {
    const stats = await reportServices.getReportStatsService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Report statistics retrieved successfully",
        data: stats,
    });
});

export const reportControllers = {
    createReportController,
    getMyReportsController,
    getReportsAgainstMeController, // Renamed from getHostReportsController
    getAllReportsController,
    updateReportStatusController,
    getReportStatsController,
};
