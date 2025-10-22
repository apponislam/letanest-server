import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { pageConfigServices } from "./pages.services";

const getPageConfigController = catchAsync(async (req: Request, res: Response) => {
    const { pageType } = req.params;

    if (pageType !== "signin" && pageType !== "signup") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid page type. Must be signin or signup");
    }

    const config = await pageConfigServices.getPageConfigService(pageType);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Page configuration retrieved successfully",
        data: config,
    });
});

const getAllPageConfigsController = catchAsync(async (req: Request, res: Response) => {
    const configs = await pageConfigServices.getAllPageConfigsService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All page configurations retrieved successfully",
        data: configs,
    });
});

// Updated: Handle file upload
const updatePageConfigController = catchAsync(async (req: Request, res: Response) => {
    const { pageType } = req.params;

    if (pageType !== "signin" && pageType !== "signup") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid page type. Must be signin or signup");
    }

    const updateData = {
        title: req.body.title,
        logo: req.body.logo, // This will be overwritten if a file is uploaded
        isActive: req.body.isActive,
    };

    const logoFile = req.file; // Get the uploaded file

    const updatedConfig = await pageConfigServices.upsertPageConfigService(pageType, updateData, logoFile);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Page configuration updated successfully",
        data: updatedConfig,
    });
});

const deletePageConfigController = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await pageConfigServices.deletePageConfigService(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Page configuration deleted successfully",
        data: null,
    });
});

export const pageConfigControllers = {
    getPageConfigController,
    getAllPageConfigsController,
    updatePageConfigController,
    deletePageConfigController,
};
