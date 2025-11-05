import mongoose, { Schema } from "mongoose";
import { IContact } from "./contact.interface";

const contactSchema = new Schema<IContact>(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "read", "replied"],
            default: "pending",
        },
        replyMessage: {
            type: String,
            trim: true,
        },
        repliedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export const Contact = mongoose.model<IContact>("Contact", contactSchema);
