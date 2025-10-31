import httpStatus from "http-status";
import ExcelJS from "exceljs";
import catchAsync from "../../../utils/catchAsync";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";

const downloadUsersExcel = catchAsync(async (req, res) => {
    const { month, year } = req.query;
    console.log("Received download request:", { month, year });

    if (!year) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Year is required for downloading user data");
    }

    const yearStr = Array.isArray(year) ? (year.length > 0 ? String(year[0]) : null) : String(year);

    if (!yearStr) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Year is required for downloading user data");
    }

    const yearNum = parseInt(yearStr);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Please provide a valid year between 2000 and 2100");
    }

    // Handle month parameter - skip if "all"
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

    console.log("Processing with:", { yearNum, monthNum });

    // Build filter based on provided parameters - FIXED TYPE
    let filter: Record<string, any> = {};

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

    console.log("Database filter:", filter);

    // Fetch users based on filter
    const users = await UserModel.find(filter).sort({ createdAt: -1 });
    console.log(`Found ${users.length} users for download`);

    if (users.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No users found for the selected period");
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Define columns
    worksheet.columns = [
        { header: "#", key: "serial", width: 8 },
        { header: "Name", key: "name", width: 30 },
        { header: "Email", key: "email", width: 40 },
        { header: "Role", key: "role", width: 15 },
        { header: "Phone", key: "phone", width: 25 },
        { header: "Created At", key: "createdAt", width: 25 },
    ];

    // Add header row style
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF14213D" },
    };
    worksheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    // Add data rows
    users.forEach((user: any, index: number) => {
        worksheet.addRow({
            serial: index + 1,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || "N/A",
            createdAt: user.createdAt.toLocaleDateString(),
        });
    });

    // Apply styles to data rows
    for (let i = 2; i <= users.length + 1; i++) {
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
    }

    // Set response headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const fileName = `users-${yearNum}${monthNum ? `-${monthNum.toString().padStart(2, "0")}` : ""}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Send the file
    await workbook.xlsx.write(res);
    res.end();
});

export const userDownloader = {
    downloadUsersExcel,
};
