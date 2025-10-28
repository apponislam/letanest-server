import mongoose, { Schema } from "mongoose";
import { IRating, RatingType, RatingStatus } from "./rating.interface";

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
        hostId: {
            type: Schema.Types.ObjectId,
            ref: "User",
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
        isDeleted: { type: Boolean, default: false },
        description: {
            type: String,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: Object.values(RatingStatus),
            default: function () {
                return this.type === RatingType.SITE ? RatingStatus.PENDING : RatingStatus.APPROVED;
            },
        },
    },
    {
        timestamps: true,
    }
);

// FIXED: Only keep propertyId+userId as unique index
ratingSchema.index(
    { propertyId: 1, userId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: RatingType.PROPERTY,
            isDeleted: false,
            status: { $in: [RatingStatus.APPROVED, RatingStatus.PENDING] }, // Include pending ratings
        },
    }
);

// FIXED: Remove unique constraint from hostId+userId - allow multiple properties from same host
ratingSchema.index(
    { hostId: 1, userId: 1 },
    {
        // REMOVED: unique: true - this was causing the duplicate key error
        partialFilterExpression: {
            type: RatingType.PROPERTY,
            isDeleted: false,
        },
    }
);

// Site rating unique index - one site rating per user
ratingSchema.index(
    { userId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: RatingType.SITE,
            isDeleted: false,
            status: { $in: [RatingStatus.APPROVED, RatingStatus.PENDING] }, // Include pending ratings
        },
    }
);

// Index for efficient queries
ratingSchema.index({ hostId: 1, type: 1 });
ratingSchema.index({ propertyId: 1, type: 1 });
ratingSchema.index({ userId: 1, type: 1 });
ratingSchema.index({ status: 1, type: 1 });
ratingSchema.index({ createdAt: 1, status: 1 });
ratingSchema.index({ isDeleted: 1 });

export const RatingModel = mongoose.model<IRating>("Rating", ratingSchema);
