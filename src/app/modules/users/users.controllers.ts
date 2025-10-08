import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { userServices } from "./users.services";
import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";

const getAllUsersController = catchAsync(async (req: Request, res: Response) => {
    const usersData = await userServices.getAllUsersService(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users retrieved successfully",
        data: usersData.users,
        meta: usersData.meta,
    });
});

const getSingleUserController = catchAsync(async (req: Request, res: Response) => {
    const user = await userServices.getSingleUserService(req.params.id);

    sendResponse(res, {
        statusCode: user ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!user,
        message: user ? "User retrieved successfully" : "User not found",
        data: user || null,
    });
});

const updateUserProfileController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone,
        address: {
            street: req.body.address,
            country: req.body.country,
            city: req.body.city,
            zip: req.body.zip,
        },
    };

    const profileImg = req.file;

    const updatedUser = await userServices.updateUserProfileService(userId, updateData, profileImg);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
    });
});

const getMySubscriptionsController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const user = await userServices.getMySubscriptionsService(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User subscriptions retrieved successfully",
        data: user,
    });
});

// ONLY THIS NEW CONTROLLER - Activate free tier
const activateFreeTierController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { subscriptionId } = req.body;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!subscriptionId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Subscription ID is required");
    }

    const freeTierData = await userServices.activateFreeTierService(userId, subscriptionId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Free tier activated successfully",
        data: freeTierData,
    });
});

export const userControllers = {
    getAllUsersController,
    getSingleUserController,
    updateUserProfileController,
    getMySubscriptionsController,
    activateFreeTierController,
};
