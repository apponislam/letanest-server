"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userDownloader = void 0;
const http_status_1 = __importDefault(require("http-status"));
const exceljs_1 = __importDefault(require("exceljs"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const auth_model_1 = require("../auth/auth.model");
const downloadUsersExcel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, year } = req.query;
    console.log("Received download request:", { month, year });
    if (!year) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Year is required for downloading user data");
    }
    const yearStr = Array.isArray(year) ? (year.length > 0 ? String(year[0]) : null) : String(year);
    if (!yearStr) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Year is required for downloading user data");
    }
    const yearNum = parseInt(yearStr);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Please provide a valid year between 2000 and 2100");
    }
    // Handle month parameter - skip if "all"
    let monthNum = null;
    if (month && month !== "all") {
        const monthStr = Array.isArray(month) ? (month.length > 0 ? String(month[0]) : null) : String(month);
        if (monthStr) {
            monthNum = parseInt(monthStr);
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Please provide a valid month between 1 and 12");
            }
        }
    }
    console.log("Processing with:", { yearNum, monthNum });
    // Build filter based on provided parameters - FIXED TYPE
    let filter = {};
    if (monthNum) {
        // Filter by specific month and year
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        filter.createdAt = { $gte: startDate, $lte: endDate };
    }
    else {
        // Filter by entire year
        const startDate = new Date(yearNum, 0, 1);
        const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
        filter.createdAt = { $gte: startDate, $lte: endDate };
    }
    console.log("Database filter:", filter);
    // Fetch users based on filter
    const users = yield auth_model_1.UserModel.find(filter).sort({ createdAt: -1 });
    console.log(`Found ${users.length} users for download`);
    if (users.length === 0) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "No users found for the selected period");
    }
    // Create Excel workbook
    const workbook = new exceljs_1.default.Workbook();
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
    users.forEach((user, index) => {
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
    yield workbook.xlsx.write(res);
    res.end();
}));
exports.userDownloader = {
    downloadUsersExcel,
};
