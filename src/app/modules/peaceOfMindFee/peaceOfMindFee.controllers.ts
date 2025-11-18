import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import { peaceOfMindFeeServices } from "./peaceOfMindFee.services";
import sendResponse from "../../../utils/sendResponse.";

const createOrUpdateFee = catchAsync(async (req, res) => {
    const fee = await peaceOfMindFeeServices.createOrUpdateFee(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Peace of mind fee updated successfully",
        data: fee,
    });
});

const getFee = catchAsync(async (req, res) => {
    const fee = await peaceOfMindFeeServices.getFee();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Peace of mind fee retrieved successfully",
        data: fee,
    });
});

export const peaceOfMindFeeControllers = {
    createOrUpdateFee,
    getFee,
};
