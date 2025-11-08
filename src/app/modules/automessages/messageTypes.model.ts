import mongoose, { Schema, Model } from "mongoose";
import { IMessageType } from "./messageTypes.interface";

const messageTypeSchema = new Schema<IMessageType>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        type: {
            type: String,
            required: [true, "Type is required"],
            unique: true,
            trim: true,
            uppercase: true,
            enum: ["WELCOME", "REMINDER", "SYSTEM"],
        },
        content: {
            type: String,
            required: [true, "Content is required"],
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        variables: {
            type: [String],
            enum: ["name", "propertyNumber"],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

messageTypeSchema.index({ type: 1 });
messageTypeSchema.index({ isActive: 1 });

export const MessageType: Model<IMessageType> = mongoose.model<IMessageType>("MessageType", messageTypeSchema);
