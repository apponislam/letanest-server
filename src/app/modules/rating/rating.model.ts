import mongoose, { Schema } from "mongoose";
import { IRating, RatingType } from "./rating.interface";

const ratingSchema = new Schema<IRating>(
    {
        type: {
            type: String,
            enum: Object.values(RatingType),
            required: true,
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            required: function () {
                return this.type === RatingType.PROPERTY;
            },
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        communication: {
            type: Number,
            min: 1,
            max: 5,
            required: function () {
                return this.type === RatingType.PROPERTY;
            },
        },
        accuracy: {
            type: Number,
            min: 1,
            max: 5,
            required: function () {
                return this.type === RatingType.PROPERTY;
            },
        },
        cleanliness: {
            type: Number,
            min: 1,
            max: 5,
            required: function () {
                return this.type === RatingType.PROPERTY;
            },
        },
        checkInExperience: {
            type: Number,
            min: 1,
            max: 5,
            required: function () {
                return this.type === RatingType.PROPERTY;
            },
        },
        overallExperience: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        country: {
            type: String,
            required: function () {
                return this.type === RatingType.SITE;
            },
        },
        description: {
            type: String,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for property ratings (one rating per user per property)
ratingSchema.index(
    { propertyId: 1, userId: 1 },
    {
        unique: true,
        partialFilterExpression: { type: RatingType.PROPERTY },
    }
);

// Index for site ratings (one rating per user for site)
ratingSchema.index(
    { userId: 1 },
    {
        unique: true,
        partialFilterExpression: { type: RatingType.SITE },
    }
);

export const RatingModel = mongoose.model<IRating>("Rating", ratingSchema);
