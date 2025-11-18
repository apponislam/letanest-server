import { Schema, model } from "mongoose";
import { IPeaceOfMindFee } from "./peaceOfMindFee.interface";

const peaceOfMindFeeSchema = new Schema<IPeaceOfMindFee>(
    {
        fee: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one document exists
peaceOfMindFeeSchema.pre("save", async function (next) {
    const count = await model("PeaceOfMindFee").countDocuments();
    if (count >= 1) {
        throw new Error("Only one peace of mind fee can exist");
    }
    next();
});

export const PeaceOfMindFee = model<IPeaceOfMindFee>("PeaceOfMindFee", peaceOfMindFeeSchema);
