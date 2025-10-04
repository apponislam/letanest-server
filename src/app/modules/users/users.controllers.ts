import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { userServices } from "./users.services";
import httpStatus from "http-status";

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

export const userControllers = {
    getAllUsersController,
    getSingleUserController,
};
