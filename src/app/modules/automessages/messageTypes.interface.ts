import { Types } from "mongoose";

export interface IMessageType {
    _id?: Types.ObjectId;
    name: string;
    type: "WELCOME" | "REMINDER" | "SYSTEM";
    content: string;
    isActive: boolean;
    variables?: ("name" | "propertyNumber")[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateMessageTypeDto {
    name: string;
    type: "WELCOME" | "REMINDER" | "SYSTEM";
    content: string;
    variables?: ("name" | "propertyNumber")[];
}

export interface UpdateMessageTypeDto {
    name?: string;
    type?: "WELCOME" | "REMINDER" | "SYSTEM";
    content?: string;
    variables?: ("name" | "propertyNumber")[];
    isActive?: boolean;
}
