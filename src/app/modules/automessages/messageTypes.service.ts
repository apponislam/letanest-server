import httpStatus from "http-status";
import { Types } from "mongoose";
import { MessageType } from "./messageTypes.model";
import { CreateMessageTypeDto, UpdateMessageTypeDto, IMessageType } from "./messageTypes.interface";
import ApiError from "../../../errors/ApiError";

const createMessageType = async (data: CreateMessageTypeDto): Promise<IMessageType> => {
    const existingType = await MessageType.findOne({ type: data.type.toUpperCase() });
    if (existingType) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Message type '${data.type}' already exists`);
    }

    const messageType = await MessageType.create({
        ...data,
        type: data.type.toUpperCase(),
    });

    return messageType;
};

const getAllMessageTypes = async (): Promise<IMessageType[]> => {
    const messageTypes = await MessageType.find().sort({ createdAt: -1 });
    return messageTypes;
};

const getMessageTypeById = async (id: string): Promise<IMessageType> => {
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid message type ID");
    }

    const messageType = await MessageType.findById(id);
    if (!messageType) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message type not found");
    }

    return messageType;
};

const getMessageTypeByType = async (type: string): Promise<IMessageType> => {
    const messageType = await MessageType.findOne({ type: type.toUpperCase() });
    if (!messageType) {
        throw new ApiError(httpStatus.NOT_FOUND, `Message type '${type}' not found`);
    }

    return messageType;
};

const updateMessageType = async (id: string, data: UpdateMessageTypeDto): Promise<IMessageType> => {
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid message type ID");
    }

    // Create a copy of data to modify
    const updateData: UpdateMessageTypeDto = { ...data };

    if (updateData.type) {
        const existingType = await MessageType.findOne({
            type: updateData.type.toUpperCase(),
            _id: { $ne: id },
        });
        if (existingType) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Message type '${updateData.type}' already exists`);
        }
        // Type is already validated by the schema enum, so we can safely assign
        updateData.type = updateData.type.toUpperCase() as "WELCOME" | "REMINDER" | "SYSTEM";
    }

    const messageType = await MessageType.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!messageType) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message type not found");
    }

    return messageType;
};

const deleteMessageType = async (id: string): Promise<void> => {
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid message type ID");
    }

    const messageType = await MessageType.findByIdAndDelete(id);
    if (!messageType) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message type not found");
    }
};

export const messageTypesServices = {
    createMessageType,
    getAllMessageTypes,
    getMessageTypeById,
    getMessageTypeByType,
    updateMessageType,
    deleteMessageType,
};
