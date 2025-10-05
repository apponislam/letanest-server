// controllers/verification.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import catchAsync from "../../../utils/catchAsync";
import { verificationService } from "./verification.service";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { updateStatusSchema, verifySchema } from "./verification.validation";
import sendResponse from "../../../utils/sendResponse.";

const submitVerification = catchAsync(async (req: Request, res: Response) => {
    const validatedData = verifySchema.parse(req.body);

    if (!req.files || !(req.files as any).proofAddress || !(req.files as any).proofID) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Both proof of address and proof of ID files are required");
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const userId = new Types.ObjectId(req.user?.id);

    const verification = await verificationService.createVerification(validatedData, files, userId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Verification submitted successfully",
        data: verification,
    });
});

const getUserVerifications = catchAsync(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(req.user?.id);
    const result = await verificationService.getVerificationsByUser(userId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verifications retrieved successfully",
        data: result.verifications,
        meta: result.meta,
    });
});

const getVerification = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id ? new Types.ObjectId(req.user.id) : undefined;

    const verification = await verificationService.getVerificationById(id, userId);

    if (!verification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Verification not found");
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification retrieved successfully",
        data: verification,
    });
});

const getAllVerifications = catchAsync(async (req: Request, res: Response) => {
    const result = await verificationService.getAllVerifications(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verifications retrieved successfully",
        data: result.verifications,
        meta: result.meta,
    });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);

    const verification = await verificationService.updateVerificationStatus(id, validatedData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification status updated successfully",
        data: verification,
    });
});

const deleteVerification = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id ? new Types.ObjectId(req.user.id) : undefined;

    const verification = await verificationService.deleteVerification(id, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification deleted successfully",
        data: verification,
    });
});

const serveFile = catchAsync(async (req: Request, res: Response) => {
    const { id, fileType } = req.params;

    if (fileType !== "proofAddress" && fileType !== "proofID") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid file type");
    }

    const verification = await verificationService.getVerificationById(id);

    if (!verification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Verification not found");
    }

    const fileInfo = verification[fileType];
    if (!fileInfo || !fileInfo.path) {
        throw new ApiError(httpStatus.NOT_FOUND, "File not found");
    }

    res.setHeader("Content-Type", fileInfo.mimetype);
    res.setHeader("Content-Disposition", `inline; filename="${fileInfo.originalName}"`);
    res.sendFile(fileInfo.path, { root: "." });
});

export const verificationController = {
    submitVerification,
    getUserVerifications,
    getVerification,
    getAllVerifications,
    updateStatus,
    deleteVerification,
    serveFile,
};
