import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import httpStatus from "http-status";
import { termsService } from "./public.services";
import sendResponse from "../../../utils/sendResponse.";

const createTermsController = catchAsync(async (req: Request, res: Response) => {
    if (!req.user?._id) throw new Error("Unauthorized: user not logged in");

    const result = await termsService.createTermsService(req.body, req.user._id);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Terms & Conditions created successfully",
        data: result,
    });
});

const getAllTermsController = catchAsync(async (_req: Request, res: Response) => {
    const result = await termsService.getAllTermsService();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Terms & Conditions retrieved successfully",
        data: result,
    });
});

const getTermByIdController = catchAsync(async (req: Request, res: Response) => {
    const result = await termsService.getTermByIdService(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Terms & Conditions retrieved successfully",
        data: result,
    });
});

const updateTermController = catchAsync(async (req: Request, res: Response) => {
    const result = await termsService.updateTermService(req.params.id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Terms & Conditions updated successfully",
        data: result,
    });
});

const deleteTermController = catchAsync(async (req: Request, res: Response) => {
    await termsService.deleteTermService(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Terms & Conditions deleted successfully",
        data: null,
    });
});

const getTermsByCreatorTypeController = catchAsync(async (req: Request, res: Response) => {
    const result = await termsService.getTermsByCreatorTypeService(req.params.creatorType);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Terms & Conditions retrieved successfully",
        data: result,
    });
});

const getPropertyTermsController = catchAsync(async (req: Request, res: Response) => {
    const result = await termsService.getPropertyTermsService(req.params.propertyId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Property-specific Terms & Conditions retrieved successfully",
        data: result,
    });
});

export const termsController = {
    createTermsController,
    getAllTermsController,
    getTermByIdController,
    updateTermController,
    deleteTermController,
    getTermsByCreatorTypeController,
    getPropertyTermsController,
};
