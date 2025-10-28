import mongoose from "mongoose";

export enum RatingType {
    PROPERTY = "property",
    SITE = "site",
}

export enum RatingStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}

export interface IRating extends Document {
    type: RatingType;
    propertyId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    hostId?: mongoose.Types.ObjectId;
    communication?: number;
    accuracy?: number;
    cleanliness?: number;
    checkInExperience?: number;
    overallExperience: number;
    country?: string;
    description?: string;
    isDeleted: boolean;
    status: RatingStatus;
    createdAt: Date;
    updatedAt: Date;
}
