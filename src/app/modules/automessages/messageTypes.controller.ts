import { Request, Response } from "express";
import httpStatus from "http-status";
import { messageTypesServices } from "./messageTypes.service";
import { CreateMessageTypeDto, UpdateMessageTypeDto } from "./messageTypes.interface";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";

const createMessageType = catchAsync(async (req: Request, res: Response) => {
    const data: CreateMessageTypeDto = req.body;

    const result = await messageTypesServices.createMessageType(data);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Message type created successfully",
        data: result,
    });
});

const getAllMessageTypes = catchAsync(async (req: Request, res: Response) => {
    const result = await messageTypesServices.getAllMessageTypes();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message types retrieved successfully",
        data: result,
    });
});

const getMessageTypeById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await messageTypesServices.getMessageTypeById(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message type retrieved successfully",
        data: result,
    });
});

const getMessageTypeByType = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.params;

    const result = await messageTypesServices.getMessageTypeByType(type);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message type retrieved successfully",
        data: result,
    });
});

const updateMessageType = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateMessageTypeDto = req.body;

    const result = await messageTypesServices.updateMessageType(id, data);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message type updated successfully",
        data: result,
    });
});

const deleteMessageType = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await messageTypesServices.deleteMessageType(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message type deleted successfully",
        data: null,
    });
});

export const messageTypesController = {
    createMessageType,
    getAllMessageTypes,
    getMessageTypeById,
    getMessageTypeByType,
    updateMessageType,
    deleteMessageType,
};
