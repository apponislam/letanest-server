import mongoose from "mongoose";

// export interface IReport extends Document {
//     guestId: mongoose.Types.ObjectId;
//     hostId: mongoose.Types.ObjectId;
//     reason: string;
//     message: string;
//     status: "pending" | "resolved";
//     createdAt: Date;
//     updatedAt: Date;
// }

// export interface ICreateReport {
//     guestId: string;
//     hostId: string;
//     reason: string;
//     message: string;
// }

export interface IReport extends Document {
    reporterId: mongoose.Types.ObjectId;
    reportedUserId: mongoose.Types.ObjectId;
    conversationId?: mongoose.Types.ObjectId;
    reason: string;
    message: string;
    status: "pending" | "resolved" | "dismissed";
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateReport {
    reporterId: string;
    reportedUserId: string;
    reason: string;
    message: string;
}
