import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import httpStatus from "http-status";
import { termsService } from "./public.services";
import sendResponse from "../../../utils/sendResponse.";

const createTermsController = catchAsync(async (req: Request, res: Response) => {
    if (!req.user?._id) throw new Error("Unauthorized: user not logged in");
    const result = await termsService.createTermsService(req.body, req.user._id);
    sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Terms & Conditions created successfully", data: result });
});

const getAllTermsController = catchAsync(async (_req, res) => {
    const result = await termsService.getAllTermsService();
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Terms & Conditions retrieved successfully", data: result });
});

const getTermByIdController = catchAsync(async (req, res) => {
    const result = await termsService.getTermByIdService(req.params.id);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Terms & Conditions retrieved successfully", data: result });
});

const getDefaultHostTermsController = catchAsync(async (_req, res) => {
    const term = await termsService.getDefaultHostTermsService();
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Default Host Terms & Conditions retrieved successfully", data: term });
});

const updateTermController = catchAsync(async (req, res) => {
    const result = await termsService.updateTermService(req.params.id, req.body);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Terms & Conditions updated successfully", data: result });
});

const deleteTermController = catchAsync(async (req, res) => {
    await termsService.deleteTermService(req.params.id);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Terms & Conditions deleted successfully", data: null });
});

const getTermsByTargetController = catchAsync(async (req, res) => {
    const terms = await termsService.getTermsByTargetService(req.params.target);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: `Terms & Conditions for ${req.params.target} retrieved successfully`, data: terms });
});

// const getPropertyTermsController = catchAsync(async (req, res) => {
//     const term = await termsService.getPropertyTermsService(req.params.propertyId);
//     sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Property-specific Terms & Conditions retrieved successfully", data: term });
// });

const getMyDefaultHostTermsController = catchAsync(async (req: Request, res: Response) => {
    if (!req.user?._id) throw new Error("Unauthorized: user not logged in");

    const result = await termsService.getMyDefaultHostTermsService(req.user._id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Default Host Terms & Conditions retrieved successfully",
        data: result,
    });
});

const getPropertyTermsController = catchAsync(async (_req, res) => {
    const term = await termsService.getPropertyTermsService();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Property Terms & Conditions retrieved successfully",
        data: term,
    });
});

export const termsController = {
    createTermsController,
    getAllTermsController,
    getTermByIdController,
    getDefaultHostTermsController,
    updateTermController,
    deleteTermController,
    getTermsByTargetController,
    // getPropertyTermsController,
    getMyDefaultHostTermsController,
    getPropertyTermsController,
};
