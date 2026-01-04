import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import { bankDetailsServices } from "./bankDetails.services";
import sendResponse from "../../../utils/sendResponse.";

const createBankDetails = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const bankDetails = await bankDetailsServices.createBankDetails({
        ...req.body,
        userId,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Bank details added successfully",
        data: bankDetails,
    });
});

const getMyBankDetails = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const bankDetails = await bankDetailsServices.getMyBankDetails(userId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: bankDetails ? "Bank details retrieved successfully" : "No bank details found",
        data: bankDetails,
    });
});

const getBankDetailsByUserId = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const bankDetails = await bankDetailsServices.getBankDetailsByUserId(userId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Bank details retrieved successfully",
        data: bankDetails,
    });
});

const updateMyBankDetails = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const bankDetails = await bankDetailsServices.updateMyBankDetails(userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Bank details updated successfully",
        data: bankDetails,
    });
});

const deleteMyBankDetails = catchAsync(async (req, res) => {
    const userId = req.user._id;
    await bankDetailsServices.deleteMyBankDetails(userId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Bank details deleted successfully",
        data: null,
    });
});

export const bankDetailsControllers = {
    createBankDetails,
    getMyBankDetails,
    getBankDetailsByUserId,
    updateMyBankDetails,
    deleteMyBankDetails,
};
