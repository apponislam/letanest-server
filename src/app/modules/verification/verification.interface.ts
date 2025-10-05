import { Document, Types } from "mongoose";

export interface IFileInfo {
    filename: string;
    originalName: string;
    path: string;
    mimetype: string;
    size: number;
}

export interface IVerification extends Document {
    firstName: string;
    lastName: string;
    dob: Date;
    countryOfBirth: string;
    cityOfBirth: string;
    zip: string;
    proofAddress: IFileInfo;
    proofID: IFileInfo;
    status: "pending" | "approved" | "rejected" | "under_review";
    submittedAt: Date;
    reviewedAt?: Date;
    reviewNotes?: string;
    userId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IVerificationInput {
    firstName: string;
    lastName: string;
    dob: string;
    countryOfBirth: string;
    cityOfBirth: string;
    zip: string;
}

export interface IStatusUpdate {
    status: "approved" | "rejected" | "under_review";
    reviewNotes?: string;
}

export interface IVerificationQuery {
    page?: number;
    limit?: number;
    status?: string;
}
