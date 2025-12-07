// import httpStatus from "http-status";
// import ExcelJS from "exceljs";
// import catchAsync from "../../../utils/catchAsync";
// import ApiError from "../../../errors/ApiError";
// import { Contact } from "./contact.model";
// import { IContact } from "./contact.interface";

// const downloadContactsExcel = catchAsync(async (req, res) => {
//     const { month, year, status } = req.query;

//     if (!year) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Year is required for downloading contact data");
//     }

//     // Parse year
//     const yearStr = Array.isArray(year) ? (year.length > 0 ? String(year[0]) : null) : String(year);
//     if (!yearStr) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Year is required for downloading contact data");
//     }

//     const yearNum = parseInt(yearStr);
//     if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Please provide a valid year between 2000 and 2100");
//     }

//     // Parse month
//     let monthNum = null;
//     if (month && month !== "all") {
//         const monthStr = Array.isArray(month) ? (month.length > 0 ? String(month[0]) : null) : String(month);
//         if (monthStr) {
//             monthNum = parseInt(monthStr);
//             if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
//                 throw new ApiError(httpStatus.BAD_REQUEST, "Please provide a valid month between 1 and 12");
//             }
//         }
//     }

//     // Parse status filter
//     let statusFilter = null;
//     if (status && status !== "all") {
//         const statusStr = Array.isArray(status) ? (status.length > 0 ? String(status[0]) : null) : String(status);
//         if (statusStr && ["pending", "read", "replied"].includes(statusStr)) {
//             statusFilter = statusStr;
//         }
//     }

//     console.log("Processing with:", { yearNum, monthNum, statusFilter });

//     // Build filter based on provided parameters
//     let filter: Record<string, any> = {};

//     // Date filter
//     if (monthNum) {
//         // Filter by specific month and year
//         const startDate = new Date(yearNum, monthNum - 1, 1);
//         const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
//         filter.createdAt = { $gte: startDate, $lte: endDate };
//     } else {
//         // Filter by entire year
//         const startDate = new Date(yearNum, 0, 1);
//         const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
//         filter.createdAt = { $gte: startDate, $lte: endDate };
//     }

//     // Status filter
//     if (statusFilter) {
//         filter.status = statusFilter;
//     }

//     // Fetch contacts based on filter
//     const contacts = await Contact.find(filter).sort({ createdAt: -1 });
//     console.log(`Found ${contacts.length} contacts for download`);

//     if (contacts.length === 0) {
//         throw new ApiError(httpStatus.NOT_FOUND, "No contacts found for the selected period and filters");
//     }

//     // Create Excel workbook
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Contacts");

//     // Define columns - Added Reply Message and Replied At columns
//     worksheet.columns = [
//         { header: "#", key: "serial", width: 8 },
//         { header: "First Name", key: "firstName", width: 20 },
//         { header: "Last Name", key: "lastName", width: 20 },
//         { header: "Full Name", key: "fullName", width: 30 },
//         { header: "Email", key: "email", width: 35 },
//         { header: "Message", key: "message", width: 50 },
//         { header: "Status", key: "status", width: 15 },
//         { header: "Received Time", key: "createdAt", width: 25 },
//         { header: "Reply Message", key: "replyMessage", width: 50 },
//         { header: "Replied At", key: "repliedAt", width: 25 },
//     ];

//     // Add header row style
//     const headerRow = worksheet.getRow(1);
//     headerRow.font = { bold: true };
//     headerRow.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: "FF14213D" },
//     };
//     headerRow.font = { color: { argb: "FFFFFFFF" }, bold: true };

//     // Add data rows
//     contacts.forEach((contact: IContact, index: number) => {
//         const fullName = `${contact.firstName} ${contact.lastName}`.trim();

//         // Format dates
//         const receivedDate = contact.createdAt.toLocaleDateString("en-GB");
//         const repliedDate = contact.repliedAt ? contact.repliedAt.toLocaleDateString("en-GB") : "N/A";

//         worksheet.addRow({
//             serial: index + 1,
//             firstName: contact.firstName,
//             lastName: contact.lastName,
//             fullName: fullName,
//             email: contact.email,
//             message: contact.message,
//             status: contact.status.charAt(0).toUpperCase() + contact.status.slice(1), // Capitalize first letter
//             createdAt: receivedDate,
//             replyMessage: contact.replyMessage || "N/A",
//             repliedAt: repliedDate,
//         });
//     });

//     // Apply styles to data rows
//     for (let i = 2; i <= contacts.length + 1; i++) {
//         const row = worksheet.getRow(i);
//         row.font = { size: 11 };

//         // Alternate row colors
//         if (i % 2 === 0) {
//             row.fill = {
//                 type: "pattern",
//                 pattern: "solid",
//                 fgColor: { argb: "FFF0F0F0" },
//             };
//         }

//         // Align columns properly
//         row.getCell(1).alignment = { horizontal: "center" }; // Serial number
//         row.getCell(7).alignment = { horizontal: "center" }; // Status
//         row.getCell(8).alignment = { horizontal: "center" }; // Received Date
//         row.getCell(10).alignment = { horizontal: "center" }; // Replied Date

//         // Wrap text for message and reply message columns
//         row.getCell(6).alignment = { wrapText: true }; // Message
//         row.getCell(9).alignment = { wrapText: true }; // Reply Message
//     }

//     // Auto-fit columns while keeping maximum width
//     worksheet.getColumn("message").width = 50;
//     worksheet.getColumn("replyMessage").width = 50;

//     // Set response headers for file download
//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

//     const fileName = `contacts-${yearNum}${monthNum ? `-${monthNum.toString().padStart(2, "0")}` : ""}${statusFilter ? `-${statusFilter}` : ""}.xlsx`;
//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

//     // Send the file
//     await workbook.xlsx.write(res);
//     res.end();
// });

// export const contactDownloader = {
//     downloadContactsExcel,
// };

import httpStatus from "http-status";
import ExcelJS from "exceljs";
import catchAsync from "../../../utils/catchAsync";
import ApiError from "../../../errors/ApiError";
import { Contact } from "./contact.model";
import { IContact } from "./contact.interface";

const downloadContactsExcel = catchAsync(async (req, res) => {
    const { month, year, status } = req.query;

    if (!year) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Year is required for downloading contact data");
    }

    // Parse year
    const yearStr = Array.isArray(year) ? (year.length > 0 ? String(year[0]) : null) : String(year);
    if (!yearStr) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Year is required for downloading contact data");
    }

    const yearNum = parseInt(yearStr);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Please provide a valid year between 2000 and 2100");
    }

    // Parse month
    let monthNum = null;
    if (month && month !== "all") {
        const monthStr = Array.isArray(month) ? (month.length > 0 ? String(month[0]) : null) : String(month);
        if (monthStr) {
            monthNum = parseInt(monthStr);
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Please provide a valid month between 1 and 12");
            }
        }
    }

    // Parse status filter
    let statusFilter = null;
    if (status && status !== "all") {
        const statusStr = Array.isArray(status) ? (status.length > 0 ? String(status[0]) : null) : String(status);
        if (statusStr && ["pending", "read", "replied"].includes(statusStr)) {
            statusFilter = statusStr;
        }
    }

    console.log("Processing with:", { yearNum, monthNum, statusFilter });

    // Build filter based on provided parameters
    let filter: Record<string, any> = {};

    // Date filter
    if (monthNum) {
        // Filter by specific month and year
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        filter.createdAt = { $gte: startDate, $lte: endDate };
    } else {
        // Filter by entire year
        const startDate = new Date(yearNum, 0, 1);
        const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
        filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Status filter
    if (statusFilter) {
        filter.status = statusFilter;
    }

    // Fetch contacts based on filter
    const contacts = await Contact.find(filter).sort({ createdAt: -1 });
    console.log(`Found ${contacts.length} contacts for download`);

    if (contacts.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No contacts found for the selected period and filters");
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Contacts");

    // Define columns - UPDATED TO INCLUDE PHONE
    worksheet.columns = [
        { header: "#", key: "serial", width: 8 },
        { header: "First Name", key: "firstName", width: 20 },
        { header: "Last Name", key: "lastName", width: 20 },
        { header: "Full Name", key: "fullName", width: 30 },
        { header: "Email", key: "email", width: 35 },
        { header: "Phone", key: "phone", width: 20 }, // ADDED PHONE COLUMN
        { header: "Message", key: "message", width: 50 },
        { header: "Status", key: "status", width: 15 },
        { header: "Received Time", key: "createdAt", width: 25 },
        { header: "Reply Message", key: "replyMessage", width: 50 },
        { header: "Replied At", key: "repliedAt", width: 25 },
    ];

    // Add header row style
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF14213D" },
    };
    headerRow.font = { color: { argb: "FFFFFFFF" }, bold: true };

    // Add data rows
    contacts.forEach((contact: IContact, index: number) => {
        const fullName = `${contact.firstName} ${contact.lastName}`.trim();

        // Format dates
        const receivedDate = contact.createdAt.toLocaleDateString("en-GB");
        const repliedDate = contact.repliedAt ? contact.repliedAt.toLocaleDateString("en-GB") : "N/A";

        worksheet.addRow({
            serial: index + 1,
            firstName: contact.firstName,
            lastName: contact.lastName,
            fullName: fullName,
            email: contact.email,
            phone: contact.phone || "N/A", // ADDED PHONE FIELD
            message: contact.message,
            status: contact.status.charAt(0).toUpperCase() + contact.status.slice(1), // Capitalize first letter
            createdAt: receivedDate,
            replyMessage: contact.replyMessage || "N/A",
            repliedAt: repliedDate,
        });
    });

    // Apply styles to data rows
    for (let i = 2; i <= contacts.length + 1; i++) {
        const row = worksheet.getRow(i);
        row.font = { size: 11 };

        // Alternate row colors
        if (i % 2 === 0) {
            row.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF0F0F0" },
            };
        }

        // Align columns properly
        row.getCell(1).alignment = { horizontal: "center" }; // Serial number
        row.getCell(8).alignment = { horizontal: "center" }; // Status (changed from 7 to 8)
        row.getCell(9).alignment = { horizontal: "center" }; // Received Date (changed from 8 to 9)
        row.getCell(11).alignment = { horizontal: "center" }; // Replied Date (changed from 10 to 11)

        // Wrap text for message and reply message columns
        row.getCell(7).alignment = { wrapText: true }; // Message (changed from 6 to 7)
        row.getCell(10).alignment = { wrapText: true }; // Reply Message (changed from 9 to 10)
    }

    // Auto-fit columns while keeping maximum width
    worksheet.getColumn("message").width = 50;
    worksheet.getColumn("replyMessage").width = 50;
    worksheet.getColumn("phone").width = 20; // Set phone column width

    // Set response headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const fileName = `contacts-${yearNum}${monthNum ? `-${monthNum.toString().padStart(2, "0")}` : ""}${statusFilter ? `-${statusFilter}` : ""}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Send the file
    await workbook.xlsx.write(res);
    res.end();
});

export const contactDownloader = {
    downloadContactsExcel,
};
