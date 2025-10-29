// import ApiError from "../../../errors/ApiError";
// import httpStatus from "http-status";
// import { ICreateReport, IReport } from "./reports.interface";
// import { ReportModel } from "./reports.model";

// const createReportService = async (reportData: ICreateReport): Promise<IReport> => {
//     const report = await ReportModel.create(reportData);
//     return report;
// };

// const getReportsByHostService = async (hostId: string): Promise<IReport[]> => {
//     const reports = await ReportModel.find({ hostId }).populate("guestId", "name email profileImg").sort({ createdAt: -1 });
//     return reports;
// };

// const getReportsByGuestService = async (guestId: string): Promise<IReport[]> => {
//     const reports = await ReportModel.find({ guestId }).populate("hostId", "name email profileImg").sort({ createdAt: -1 });
//     return reports;
// };

// const getAllReportsService = async (
//     page: number = 1,
//     limit: number = 10,
//     status?: "pending" | "resolved"
// ): Promise<{
//     reports: IReport[];
//     meta: {
//         page: number;
//         limit: number;
//         total: number;
//     };
// }> => {
//     const skip = (page - 1) * limit;

//     // Build query
//     const query: any = {};
//     if (status) {
//         query.status = status;
//     }

//     const [reports, total] = await Promise.all([ReportModel.find(query).populate("guestId", "name email profileImg").populate("hostId", "name email profileImg").sort({ createdAt: -1 }).skip(skip).limit(limit), ReportModel.countDocuments(query)]);

//     return {
//         reports,
//         meta: {
//             page,
//             limit,
//             total,
//         },
//     };
// };

// const updateReportStatusService = async (reportId: string, status: "pending" | "resolved"): Promise<IReport | null> => {
//     const report = await ReportModel.findByIdAndUpdate(reportId, { status }, { new: true }).populate("guestId", "name email profileImg").populate("hostId", "name email profileImg");

//     if (!report) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
//     }

//     return report;
// };

// const getReportStatsService = async () => {
//     const [total, pending, resolved] = await Promise.all([ReportModel.countDocuments(), ReportModel.countDocuments({ status: "pending" }), ReportModel.countDocuments({ status: "resolved" })]);

//     return {
//         total,
//         pending,
//         resolved,
//     };
// };

// export const reportServices = {
//     createReportService,
//     getReportsByHostService,
//     getReportsByGuestService,
//     getAllReportsService,
//     updateReportStatusService,
//     getReportStatsService,
// };

import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";
import { ICreateReport, IReport } from "./reports.interface";
import { ReportModel } from "./reports.model";

const createReportService = async (reportData: ICreateReport): Promise<IReport> => {
    const report = await ReportModel.create(reportData);
    return report;
};

const getReportsByReporterService = async (reporterId: string): Promise<IReport[]> => {
    const reports = await ReportModel.find({ reporterId }).populate("reportedUserId", "name email profileImg role").populate("conversationId", "participants").sort({ createdAt: -1 });
    return reports;
};

const getReportsAgainstUserService = async (reportedUserId: string): Promise<IReport[]> => {
    const reports = await ReportModel.find({ reportedUserId }).populate("reporterId", "name email profileImg role").populate("conversationId", "participants").sort({ createdAt: -1 });
    return reports;
};

const getAllReportsService = async (
    page: number = 1,
    limit: number = 10,
    status?: "pending" | "resolved" | "dismissed"
): Promise<{
    reports: IReport[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> => {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status) {
        query.status = status;
    }

    const [reports, total] = await Promise.all([ReportModel.find(query).populate("reporterId", "name email profileImg role").populate("reportedUserId", "name email profileImg role").populate("conversationId", "participants").sort({ createdAt: -1 }).skip(skip).limit(limit), ReportModel.countDocuments(query)]);

    return {
        reports,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const updateReportStatusService = async (reportId: string, status: "pending" | "resolved" | "dismissed"): Promise<IReport | null> => {
    const report = await ReportModel.findByIdAndUpdate(reportId, { status }, { new: true }).populate("reporterId", "name email profileImg role").populate("reportedUserId", "name email profileImg role").populate("conversationId", "participants");

    if (!report) {
        throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
    }

    return report;
};

const getReportStatsService = async () => {
    const [total, pending, resolved, dismissed] = await Promise.all([ReportModel.countDocuments(), ReportModel.countDocuments({ status: "pending" }), ReportModel.countDocuments({ status: "resolved" }), ReportModel.countDocuments({ status: "dismissed" })]);

    return {
        total,
        pending,
        resolved,
        dismissed,
    };
};

export const reportServices = {
    createReportService,
    getReportsByReporterService, // Renamed from getReportsByGuestService
    getReportsAgainstUserService, // Renamed from getReportsByHostService
    getAllReportsService,
    updateReportStatusService,
    getReportStatsService,
};
