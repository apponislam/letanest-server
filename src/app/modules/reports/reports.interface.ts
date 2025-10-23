import mongoose from "mongoose";

export interface IReport extends Document {
    guestId: mongoose.Types.ObjectId;
    hostId: mongoose.Types.ObjectId;
    reason: string;
    message: string;
    status: "pending" | "resolved";
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateReport {
    guestId: string;
    hostId: string;
    reason: string;
    message: string;
}
