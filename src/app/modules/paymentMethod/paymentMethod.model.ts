// models/paymentMethod.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { IPaymentMethod } from "./paymentMethod.interface";

export type IPaymentMethodDocument = IPaymentMethod & Document;

const paymentMethodSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        stripeCustomerId: {
            type: String,
            required: true,
            index: true,
        },
        paymentMethodId: {
            type: String,
            required: true,
            unique: true,
        },
        brand: {
            type: String,
            required: true,
        },
        last4: {
            type: String,
            required: true,
        },
        exp_month: {
            type: Number,
            required: true,
        },
        exp_year: {
            type: Number,
            required: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure only one default payment method per user
paymentMethodSchema.index(
    { userId: 1, isDefault: 1 },
    {
        partialFilterExpression: { isDefault: true },
    }
);

export const PaymentMethod = mongoose.model<IPaymentMethodDocument>("PaymentMethod", paymentMethodSchema);
