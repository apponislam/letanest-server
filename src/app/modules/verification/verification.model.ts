// models/Verification.model.ts
import { Schema, model, Types } from "mongoose";
import { IVerification } from "./verification.interface";

const fileInfoSchema = new Schema(
    {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        path: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
    },
    { _id: false }
);

const verificationSchema = new Schema(
    {
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
        },
        dob: {
            type: Date,
            required: [true, "Date of birth is required"],
        },
        countryOfBirth: {
            type: String,
            required: [true, "Country of birth is required"],
            trim: true,
        },
        cityOfBirth: {
            type: String,
            required: [true, "City of birth is required"],
            trim: true,
        },
        zip: {
            type: String,
            required: [true, "Zip code is required"],
            trim: true,
        },
        proofAddress: {
            type: fileInfoSchema,
            required: true,
        },
        proofID: {
            type: fileInfoSchema,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "under_review"],
            default: "pending",
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        reviewedAt: Date,
        reviewNotes: String,
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

verificationSchema.index({ userId: 1, status: 1 });
verificationSchema.index({ submittedAt: -1 });

export const Verification = model<IVerification>("Verification", verificationSchema);
