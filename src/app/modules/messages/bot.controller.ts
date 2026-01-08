import { Request, Response } from "express";
import httpStatus from "http-status";
import { botServices, SendMessageToAllDto, SendWelcomeMessageDto } from "./bot.service";
import ApiError from "../../../errors/ApiError";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";

const sendWelcomeMessage = catchAsync(async (req: Request, res: Response) => {
    const { message } = req.body as { message?: string };
    const userId = (req as any).user._id;

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

// Send message to all users based on MessageType
const sendMessageToAll = catchAsync(async (req: Request, res: Response) => {
    const { messageTypeId, userType } = req.body as SendMessageToAllDto;

    if (!messageTypeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Message Type ID is required");
    }

    const result = await botServices.sendMessageToAll({
        messageTypeId,
        userType,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Message "${result.messageTemplate.name}" sent to ${result.successful} ${result.userType} users successfully. ${result.failed} failed.`,
        data: result,
    });
});

// Get active message templates
const getActiveMessageTemplates = catchAsync(async (req: Request, res: Response) => {
    const templates = await botServices.getActiveMessageTemplates();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Active message templates retrieved successfully",
        data: templates,
    });
});

export const botController = {
    sendWelcomeMessage,
    sendMessageToAll,
    getActiveMessageTemplates,
};
