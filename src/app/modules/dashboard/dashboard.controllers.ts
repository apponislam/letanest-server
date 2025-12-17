import { Request, Response } from "express";
import httpStatus from "http-status";
import { dashboardServices } from "./dashboard.services";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import ApiError from "../../../errors/ApiError";

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

// const getPropertyStatusStats = catchAsync(async (req: Request, res: Response) => {
//     const stats = await dashboardServices.getPropertyStatusStats();

//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Property status statistics retrieved successfully",
//         data: stats,
//     });
// });

const getPropertyStatusStats = catchAsync(async (req: Request, res: Response) => {
    const { propertyType, startDate, endDate } = req.query;

    const filters: any = {};

    if (propertyType) {
        filters.propertyType = propertyType as string;
    }

    if (startDate) {
        filters.startDate = new Date(startDate as string);
    }

    if (endDate) {
        filters.endDate = new Date(endDate as string);
    }

    const stats = await dashboardServices.getPropertyStatusStats(filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Property status statistics retrieved successfully",
        data: stats,
    });
});

const getSiteStats = catchAsync(async (req: Request, res: Response) => {
    const analytics = await dashboardServices.getSiteStatsService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Property analytics retrieved successfully",
        data: analytics,
    });
});

const getHostStats = catchAsync(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const stats = await dashboardServices.getHostStats(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host statistics retrieved successfully",
        data: stats,
    });
});

export const dashboardControllers = {
    getDashboardStats,
    getRevenueChartData,
    getPropertyStatusStats,
    getSiteStats,
    getHostStats,
};
