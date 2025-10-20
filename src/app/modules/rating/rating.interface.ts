import mongoose from "mongoose";

export enum RatingType {
    PROPERTY = "property",
    SITE = "site",
}

export interface IRating extends Document {
    type: RatingType;
    propertyId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    communication?: number;
    accuracy?: number;
    cleanliness?: number;
    checkInExperience?: number;
    overallExperience: number;
    country?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
