import { Request, Response } from "express";
import httpStatus from "http-status";
import { dashboardServices } from "./dashboard.services";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await dashboardServices.getDashboardStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: stats,
    });
});

const getRevenueChartData = catchAsync(async (req: Request, res: Response) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const chartData = await dashboardServices.getRevenueChartData(year);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Revenue chart data retrieved successfully",
        data: chartData,
    });
});

const getPropertyStatusStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await dashboardServices.getPropertyStatusStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Property status statistics retrieved successfully",
        data: stats,
    });
});

export const dashboardControllers = {
    getDashboardStats,
    getRevenueChartData,
    getPropertyStatusStats,
};
