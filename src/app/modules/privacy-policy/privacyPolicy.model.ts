import { Schema, model } from "mongoose";
import { IPrivacyPolicy } from "./privacyPolicy.interface";

const privacyPolicySchema: Schema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        effectiveDate: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const PrivacyPolicy = model<IPrivacyPolicy>("PrivacyPolicy", privacyPolicySchema);
