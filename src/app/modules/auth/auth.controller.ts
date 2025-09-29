import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import { authServices } from "./auth.services";
import httpStatus from "http-status";
import config from "../../config";
import sendResponse from "../../../utils/sendResponse.";
import ApiError from "../../../errors/ApiError";

const register = catchAsync(async (req: Request, res: Response) => {
    const profileImg = req.file ? `/uploads/profile/${req.file.filename}` : undefined;

    const result = await authServices.registerUser({
        ...req.body,
        profileImg,
    });

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully",
        data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        },
    });
});

const resendVerifyEmailController = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.body;

    if (!id) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "User ID is required",
            data: null,
        });
    }

    const result = await authServices.resendVerificationEmailService(id);

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification email resent successfully",
        data: result,
    });
});

const verifyEmailController = catchAsync(async (req: Request, res: Response) => {
    const { token, id } = req.query;

    if (!token || !id) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Token and user ID are required",
            data: null,
        });
    }

    const user = await authServices.verifyEmailService(id as string, token as string);

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Email verified successfully",
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
        },
    });
});

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.loginUser(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Login successful",
        data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        },
    });
});

const getMeController = catchAsync(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return sendResponse(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "User not authenticated",
            data: null,
        });
    }

    const user = await authServices.getMeService(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User info retrieved successfully",
        data: user,
    });
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is required");
    }

    const result = await authServices.refreshToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Access token refreshed successfully",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged out successfully",
        data: null,
    });
});

const requestPasswordResetOtpController = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authServices.requestPasswordResetOtp(email);

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const resendPasswordResetOtpController = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authServices.resendPasswordResetOtp(email);

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const resetPasswordWithOtpController = catchAsync(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    const result = await authServices.resetPasswordWithOtp(email, otp, newPassword);

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const changePasswordController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;

    console.log(userId);

    if (!userId) {
        return sendResponse(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "Unauthorized",
            data: null,
        });
    }

    const result = await authServices.changePassword(userId, currentPassword, newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const authControllers = {
    register,
    resendVerifyEmailController,
    verifyEmailController,
    login,
    getMeController,
    refreshAccessToken,
    logout,
    requestPasswordResetOtpController,
    resendPasswordResetOtpController,
    resetPasswordWithOtpController,
    changePasswordController,
};
