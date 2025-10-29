// import mongoose, { Schema, Document } from "mongoose";
// import { IReport } from "./reports.interface";

// export interface IReportDocument extends IReport, Document {}

// const reportSchema = new Schema<IReportDocument>(
//     {
//         guestId: {
//             type: Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         hostId: {
//             type: Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         reason: {
//             type: String,
//             required: true,
//         },
//         message: {
//             type: String,
//             required: true,
//             maxlength: 1000,
//         },
//         status: {
//             type: String,
//             enum: ["pending", "resolved"],
//             default: "pending",
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// // Index for efficient queries
// reportSchema.index({ guestId: 1, createdAt: -1 });
// reportSchema.index({ hostId: 1, createdAt: -1 });
// reportSchema.index({ status: 1 });

// export const ReportModel = mongoose.model<IReportDocument>("Report", reportSchema);

import mongoose, { Schema, Document } from "mongoose";
import { IReport } from "./reports.interface";

export interface IReportDocument extends IReport, Document {}

const reportSchema = new Schema<IReportDocument>(
    {
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: false, // Optional field
        },
        reason: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        status: {
            type: String,
            enum: ["pending", "resolved", "dismissed"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ reportedUserId: 1, createdAt: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ conversationId: 1 });

export const ReportModel = mongoose.model<IReportDocument>("Report", reportSchema);
