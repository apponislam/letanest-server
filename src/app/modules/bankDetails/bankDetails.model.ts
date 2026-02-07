// import { Schema, model } from "mongoose";
// import { IBankDetails } from "./bankDetails.interface";

// const bankDetailsSchema = new Schema<IBankDetails>(
//     {
//         userId: {
//             type: Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         accountHolderName: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         accountNumber: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         bankName: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         accountType: {
//             type: String,
//             enum: ["personal", "business"],
//             required: true,
//         },
//         country: {
//             type: String,
//             required: true,
//         },
//         isVerified: {
//             type: Boolean,
//             default: false,
//         },
//         verifiedAt: {
//             type: Date,
//         },
//         isActive: {
//             type: Boolean,
//             default: true,
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// export const BankDetails = model<IBankDetails>("BankDetails", bankDetailsSchema);

import { Schema, model } from "mongoose";
import { IBankDetails } from "./bankDetails.interface";

const bankDetailsSchema = new Schema<IBankDetails>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        accountHolderName: {
            type: String,
            required: [true, "Account holder name is required"],
            trim: true,
        },
        accountNumber: {
            type: String,
            required: [true, "Account number is required"],
            trim: true,
        },
        sortCode: {
            type: String,
            required: [true, "Sort code is required"],
            trim: true,
        },
        bankName: {
            type: String,
            required: [true, "Bank name is required"],
            trim: true,
        },
        accountType: {
            type: String,
            enum: {
                values: ["personal", "business"],
                message: "Account type must be personal or business",
            },
            required: [true, "Account type is required"],
        },
        country: {
            type: String,
            required: [true, "Country is required"],
        },
        iban: {
            type: String,
            trim: true,
        },
        bicSwift: {
            type: String,
            trim: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedAt: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

export const BankDetails = model<IBankDetails>("BankDetails", bankDetailsSchema);
