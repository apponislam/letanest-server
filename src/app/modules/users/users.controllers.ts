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

// Connect Stripe account
const connectStripeAccountController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const result = await userServices.connectStripeAccountService(userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe account connected successfully",
        data: result,
    });
});

// Get Stripe account status
const getStripeAccountStatusController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const result = await userServices.getStripeAccountStatusService(userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe account status retrieved successfully",
        data: result,
    });
});

// Get Stripe dashboard
const getStripeDashboardController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const result = await userServices.getStripeDashboardService(userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe dashboard link retrieved successfully",
        data: result,
    });
});

// Disconnect Stripe account
const disconnectStripeAccountController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const result = await userServices.disconnectStripeAccountService(userId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe account disconnected successfully",
        data: result,
    });
});

const getMyProfileController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const user = await userServices.getMyProfileService(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User profile retrieved successfully",
        data: user,
    });
});

const getRandomAdminController = catchAsync(async (req: Request, res: Response) => {
    const admin = await userServices.getRandomAdminService();

    sendResponse(res, {
        statusCode: admin ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!admin,
        message: admin ? "Random admin retrieved successfully" : "No admin found",
        data: admin || null,
    });
});

const changeUserRoleController = catchAsync(async (req: Request, res: Response) => {
    const { userId, newRole } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (!userId || !newRole) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User ID and new role are required");
    }

    const result = await userServices.changeUserRoleService(userId, newRole, adminId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `User role changed to ${newRole} successfully`,
        data: result,
    });
});

const deleteUserController = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
    }

    const result = await userServices.deleteUserService(userId, adminId.toString());

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User deleted successfully",
        data: result,
    });
});

const getReceiveEmailsController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const emailPreference = await userServices.getReceiveEmailsService(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Email notification preference retrieved successfully",
        data: {
            receiveEmails: emailPreference,
        },
    });
});

const toggleReceiveEmailsController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const updatedUser = await userServices.toggleReceiveEmailsService(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Email notifications ${updatedUser.receiveEmails ? "enabled" : "disabled"} successfully`,
        data: {
            receiveEmails: updatedUser.receiveEmails,
        },
    });
});

export const userControllers = {
    getAllUsersController,
    getSingleUserController,
    updateUserProfileController,
    getMySubscriptionsController,
    activateFreeTierController,
    // stripe
    connectStripeAccountController,
    getStripeAccountStatusController,
    getStripeDashboardController,
    disconnectStripeAccountController,
    // get my profile
    getMyProfileController,
    // randorm admin
    getRandomAdminController,

    //change user role
    changeUserRoleController,

    //delete user
    deleteUserController,
    // receiveEmails
    getReceiveEmailsController,
    toggleReceiveEmailsController,
};
