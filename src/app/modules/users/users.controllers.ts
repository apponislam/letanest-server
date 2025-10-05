import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { userServices } from "./users.services";
import httpStatus from "http-status";
import { Types } from "mongoose";

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

export const userControllers = {
    getAllUsersController,
    getSingleUserController,
    updateUserProfileController,
};
