import mongoose, { Schema } from "mongoose";

export const roles = {
    GUEST: "GUEST",
    HOST: "HOST",
    ADMIN: "ADMIN",
};

const TermsAndConditionsSchema = new mongoose.Schema(
    {
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
        target: {
            type: String,
            enum: [roles.HOST, roles.GUEST],
            required: [true, "Target is required"],
            default: roles.GUEST,
        },
        creatorType: {
            type: String,
            enum: [roles.ADMIN, roles.HOST],
            required: [true, "CreatorType is required"],
        },
        hostTarget: {
            type: String,
            enum: ["default", "property"],
            validate: {
                validator: function (this: any, value: string) {
                    return this.creatorType === roles.HOST || !value;
                },
                message: "hostTarget can only be set when creatorType is HOST",
            },
        },
        // propertyId: {
        //     type: Schema.Types.ObjectId,
        //     ref: "Property",
        //     required: function (this: any) {
        //         return this.target === roles.HOST && this.hostTarget === "property";
        //     },
        // },
    },
    { timestamps: true }
);

// Optional: pre-save validation for HOST property-specific T&C
// TermsAndConditionsSchema.pre("save", function (next) {
//     if (this.creatorType === roles.HOST && this.hostTarget === "property" && !this.propertyId) {
//         return next(new Error("PropertyId is required for property-specific T&C"));
//     }
//     next();
// });

export const TermsAndConditionsModel = mongoose.model("TermsAndConditions", TermsAndConditionsSchema);
