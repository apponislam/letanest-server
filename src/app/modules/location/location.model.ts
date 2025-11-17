import mongoose, { Schema, Document } from "mongoose";
import { ILocation } from "./location.interface";

export interface ILocationDocument extends ILocation, Document {}

const locationSchema = new Schema<ILocationDocument>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for better search performance
locationSchema.index({ name: "text" });
locationSchema.index({ isActive: 1 });

export const Location = mongoose.model<ILocationDocument>("Location", locationSchema);
