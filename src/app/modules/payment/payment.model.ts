import { model, Schema } from "mongoose";
import { IPayment } from "./payment.interfaces";

const paymentSchema = new Schema<IPayment>(
    {
        stripePaymentIntentId: {
            type: String,
            required: true,
            unique: true,
        },

        agreedFee: {
            type: Number,
            required: true,
        },
        bookingFee: {
            type: Number,
            required: true,
        },
        extraFee: {
            type: Number,
            default: 0,
        },
        extraFeePaid: Boolean,
        totalAmount: {
            type: Number,
            required: true,
        },

        commissionRate: {
            type: Number,
            required: true,
        },
        commissionAmount: {
            type: Number,
            required: true,
        },
        hostAmount: {
            type: Number,
            required: true,
        },
        platformTotal: {
            type: Number,
            required: true,
        },

        // Relationships
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        messageId: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            required: true,
        },
        hostId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        paymentType: {
            type: String,
            enum: ["Stripe", "Bank"],
            default: undefined,
        },
        reviewedSend: Boolean,
        isBookingFeePaidOnly: Boolean,
        bookingFeePaidDone: Number,
        comissionPaidDone: Number,
        commissionPaid: Boolean,
        paidAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
