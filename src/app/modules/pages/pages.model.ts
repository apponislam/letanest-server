import mongoose, { Schema, Document } from "mongoose";
import { IPageConfig } from "./pages.interface";

export interface IPageConfigDocument extends IPageConfig, Document {}

const pageConfigSchema = new Schema<IPageConfigDocument>(
    {
        pageType: {
            type: String,
            enum: ["signin", "signup"],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        logo: {
            type: String,
            default: "",
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

export const PageConfigModel = mongoose.model<IPageConfigDocument>("PageConfig", pageConfigSchema);
