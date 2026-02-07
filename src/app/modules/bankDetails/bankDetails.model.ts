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
            required: true,
            trim: true,
        },
        accountNumber: {
            type: String,
            required: true,
            trim: true,
        },
        sortCode: {
            type: String,
            required: true,
            trim: true,
        },
        bankName: {
            type: String,
            required: true,
            trim: true,
        },
        accountType: {
            type: String,
            enum: ["personal", "business"],
            required: true,
        },
        country: {
            type: String,
            required: true,
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
