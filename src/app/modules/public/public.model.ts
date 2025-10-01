import mongoose, { Schema } from "mongoose";

export const roles = {
    GUEST: "GUEST",
    HOST: "HOST",
    ADMIN: "ADMIN",
};

const TermsAndConditionsSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: [true, "T&C ID is required"],
            unique: true,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
        },
        content: {
            type: String,
            required: [true, "Content is required"],
        },
        version: {
            type: String,
        },
        effectiveDate: {
            type: Date,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "CreatedBy (user ID) is required"],
        },
        creatorType: {
            type: String,
            enum: {
                values: [roles.ADMIN, roles.HOST],
                message: "CreatorType must be either 'ADMIN' or 'HOST'",
            },
            required: [true, "CreatorType is required"],
        },
        hostTarget: {
            type: String,
            enum: {
                values: ["default", "property"],
                message: "HostTarget must be 'default' or 'property'",
            },
        },
        propertyId: {
            type: String,
            // We'll validate later if hostTarget === 'property'
        },
    },
    { timestamps: true }
);

// Optional: validate propertyId is required only when hostTarget === "property"
TermsAndConditionsSchema.pre("save", function (next) {
    if (this.creatorType === roles.HOST && this.hostTarget === "property" && !this.propertyId) {
        return next(new Error("PropertyId is required for property-specific T&C"));
    }
    next();
});

export const TermsAndConditionsModel = mongoose.model("TermsAndConditions", TermsAndConditionsSchema);
