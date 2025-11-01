import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import { PrivacyPolicyService } from "./privacyPolicy.service";

const createOrUpdatePrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await PrivacyPolicyService.createOrUpdatePrivacyPolicy({
        ...req.body,
        createdBy: req.user?._id,
    });

    res.status(httpStatus.OK).send({
        statusCode: httpStatus.OK,
        success: true,
        message: "Privacy Policy saved successfully",
        data: result,
    });
});

const getPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await PrivacyPolicyService.getPrivacyPolicy();
    res.status(httpStatus.OK).send({
        statusCode: httpStatus.OK,
        success: true,
        message: "Privacy Policy retrieved successfully",
        data: result,
    });
});

const updatePrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await PrivacyPolicyService.updatePrivacyPolicy(req.body);

    res.status(httpStatus.OK).send({
        statusCode: httpStatus.OK,
        success: true,
        message: "Privacy Policy updated successfully",
        data: result,
    });
});

export const PrivacyPolicyController = {
    createOrUpdatePrivacyPolicy,
    getPrivacyPolicy,
    updatePrivacyPolicy,
};
