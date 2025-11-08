import { Request, Response } from "express";
import httpStatus from "http-status";
import { botServices, SendWelcomeMessageDto } from "./bot.service";
import ApiError from "../../../errors/ApiError";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";

const sendWelcomeMessage = catchAsync(async (req: Request, res: Response) => {
    const { message } = req.body as SendWelcomeMessageDto;
    const userId = (req as any).user._id; // From authenticated user

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const result = await botServices.sendWelcomeMessage(userId, {
        message,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Welcome message sent successfully",
        data: result,
    });
});

export const botController = {
    sendWelcomeMessage,
};
