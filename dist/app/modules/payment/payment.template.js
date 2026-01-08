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
exports.paymentTemplate = exports.generatePaymentsPDF = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const payment_model_1 = require("./payment.model");
const generateHostSingleInvoicePDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    try {
        const { id } = req.params;
        const payment = yield payment_model_1.PaymentModel.findById(id).populate("userId", "name email phone").populate("hostId", "name email phone").populate("propertyId", "title address city state").exec();
        if (!payment) {
            res.status(404).json({ error: "Payment not found" });
            return;
        }
        // Type assertions for populated fields
        const populatedPayment = payment;
        // const templatePath = path.join(__dirname, "../../../../public/templates/HostSingleinvoiceTemplate.html");
        const templatePath = path_1.default.resolve(process.cwd(), "public/templates/HostSingleinvoiceTemplate.html");
        if (!fs_1.default.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }
        let html = fs_1.default.readFileSync(templatePath, "utf8");
        const statusClass = `status-${payment.status.toLowerCase()}`;
        // Date handling
        const paidAtDate = new Date(payment.paidAt || payment.createdAt);
        const createdAtDate = new Date(payment.createdAt);
        // Format numbers properly
        const hostAmount = ((_a = payment.hostAmount) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || "0.00";
        const agreedFee = ((_b = payment.agreedFee) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || "0.00";
        const bookingFee = ((_c = payment.bookingFee) === null || _c === void 0 ? void 0 : _c.toFixed(2)) || "0.00";
        const extraFee = ((_d = payment.extraFee) === null || _d === void 0 ? void 0 : _d.toFixed(2)) || "0.00";
        const commissionAmount = ((_e = payment.commissionAmount) === null || _e === void 0 ? void 0 : _e.toFixed(2)) || "0.00";
        const commissionRate = ((_f = payment.commissionRate) === null || _f === void 0 ? void 0 : _f.toString()) || "0";
        // Get property address
        const propertyAddress = ((_g = populatedPayment.propertyId) === null || _g === void 0 ? void 0 : _g.address) ? `${populatedPayment.propertyId.address}, ${populatedPayment.propertyId.city || ""}, ${populatedPayment.propertyId.state || ""}`.replace(/,\s*,/g, ",").replace(/,\s*$/, "") : "N/A";
        html = html
            .replace("{{propertyTitle}}", ((_h = populatedPayment.propertyId) === null || _h === void 0 ? void 0 : _h.title) || "N/A")
            .replace("{{propertyAddress}}", propertyAddress)
            .replace("{{hostName}}", ((_j = populatedPayment.hostId) === null || _j === void 0 ? void 0 : _j.name) || "N/A")
            .replace("{{hostEmail}}", ((_k = populatedPayment.hostId) === null || _k === void 0 ? void 0 : _k.email) || "N/A")
            .replace("{{hostPhone}}", ((_l = populatedPayment.hostId) === null || _l === void 0 ? void 0 : _l.phone) || "N/A")
            .replace("{{guestName}}", ((_m = populatedPayment.userId) === null || _m === void 0 ? void 0 : _m.name) || "N/A")
            .replace("{{guestEmail}}", ((_o = populatedPayment.userId) === null || _o === void 0 ? void 0 : _o.email) || "N/A")
            .replace("{{guestPhone}}", ((_p = populatedPayment.userId) === null || _p === void 0 ? void 0 : _p.phone) || "N/A")
            .replace("{{date}}", createdAtDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }))
            .replace("{{paymentDate}}", paidAtDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }))
            .replace("{{invoiceDate}}", new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }))
            .replace("{{status}}", payment.status.charAt(0).toUpperCase() + payment.status.slice(1))
            .replace("{{statusClass}}", statusClass)
            .replace("{{paymentId}}", payment._id.toString())
            .replace("{{stripePaymentId}}", payment.stripePaymentIntentId || "N/A")
            .replace("{{hostAmount}}", hostAmount)
            .replace("{{agreedFee}}", agreedFee)
            .replace("{{bookingFee}}", bookingFee)
            .replace("{{extraFee}}", extraFee)
            .replace("{{commissionAmount}}", commissionAmount)
            .replace("{{commissionRate}}", commissionRate);
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = yield browser.newPage();
        yield page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = yield page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "10px",
                right: "10px",
                bottom: "10px",
                left: "10px",
            },
        });
        yield browser.close();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=receipt-${id}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    }
    catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// Multiple payments PDF with date range
const generateHostPaymentsPDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fromDate, toDate } = req.body;
        const hostId = req.user._id; // Get host ID from auth middleware
        if (!fromDate || !toDate) {
            res.status(400).json({ error: "From date and to date are required" });
            return;
        }
        // Convert dates to start and end of day
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        // Fetch payments within date range for specific host
        const payments = yield payment_model_1.PaymentModel.find({
            hostId: hostId, // Only get payments for this host
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
            status: "completed", // Only completed payments
        })
            .populate("userId", "name email phone")
            .populate("hostId", "name email phone")
            .populate("propertyId", "title")
            .sort({ createdAt: -1 })
            .exec();
        if (!payments || payments.length === 0) {
            res.status(404).json({ error: "No payments found for the selected date range" });
            return;
        }
        // const templatePath = path.join(__dirname, "../../../../public/templates/HostInvoicesTemplate.html");
        const templatePath = path_1.default.resolve(process.cwd(), "public/templates/HostInvoicesTemplate.html");
        if (!fs_1.default.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }
        let html = fs_1.default.readFileSync(templatePath, "utf8");
        // Calculate totals - ONLY total amount and bookings
        const totalAmount = payments.reduce((sum, payment) => sum + (payment.hostAmount || 0), 0);
        const totalBookings = payments.length;
        // Format dates for display
        const fromDateDisplay = new Date(fromDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const toDateDisplay = new Date(toDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const reportDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        // Generate payments table rows - NO platform fees
        let paymentsTableRows = "";
        payments.forEach((payment, index) => {
            var _a, _b;
            const populatedPayment = payment;
            const paymentDate = new Date(payment.paidAt || payment.createdAt).toLocaleDateString("en-US");
            paymentsTableRows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${((_a = populatedPayment.propertyId) === null || _a === void 0 ? void 0 : _a.title) || "N/A"}</td>
                    <td>${((_b = populatedPayment.userId) === null || _b === void 0 ? void 0 : _b.name) || "N/A"}</td>
                    <td>${paymentDate}</td>
                    <td>$${(payment.hostAmount || 0).toFixed(2)}</td>
                    <td>${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</td>
                </tr>
            `;
        });
        // Replace template variables
        html = html.replace("{{fromDate}}", fromDateDisplay).replace("{{toDate}}", toDateDisplay).replace("{{reportDate}}", reportDate).replace("{{totalAmount}}", totalAmount.toFixed(2)).replace("{{totalBookings}}", totalBookings.toString()).replace("{{paymentsTable}}", paymentsTableRows);
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = yield browser.newPage();
        yield page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = yield page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        });
        yield browser.close();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=payments-report-${fromDate}-to-${toDate}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    }
    catch (error) {
        console.error("Error generating payments PDF:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// Admin Pdf
/**
 * Generate PDF for payments within date range using Puppeteer
 */
const generatePaymentsPDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fromDate, toDate } = req.body;
        if (!fromDate || !toDate) {
            res.status(400).json({ error: "From date and to date are required" });
            return;
        }
        // Query payments within date range
        const payments = yield payment_model_1.PaymentModel.find({
            createdAt: {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            },
        })
            .populate("userId", "name email")
            .populate("propertyId", "title")
            .populate("hostId", "name email")
            .sort({ createdAt: -1 });
        if (payments.length === 0) {
            res.status(404).json({ error: "No payments found in the selected date range" });
            return;
        }
        // Calculate totals
        const totals = payments.reduce((acc, payment) => ({
            totalRevenue: acc.totalRevenue + (payment.totalAmount || 0),
            totalCommission: acc.totalCommission + (payment.commissionAmount || 0),
            totalBookingFees: acc.totalBookingFees + (payment.bookingFee || 0),
            totalExtraFees: acc.totalExtraFees + (payment.extraFee || 0),
            totalPlatformTotal: acc.totalPlatformTotal + (payment.platformTotal || 0),
            totalHostEarnings: acc.totalHostEarnings + (payment.hostAmount || 0),
            totalTransactions: acc.totalTransactions + 1,
        }), {
            totalRevenue: 0,
            totalCommission: 0,
            totalBookingFees: 0,
            totalExtraFees: 0,
            totalPlatformTotal: 0,
            totalHostEarnings: 0,
            totalTransactions: 0,
        });
        // Read HTML template
        // const templatePath = path.join(__dirname, "../../../../public/templates/AdminPaymentsReport.html");
        const templatePath = path_1.default.resolve(process.cwd(), "public/templates/AdminPaymentsReport.html");
        if (!fs_1.default.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }
        let html = fs_1.default.readFileSync(templatePath, "utf8");
        // Format dates for display
        const fromDateDisplay = new Date(fromDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const toDateDisplay = new Date(toDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const reportDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const reportTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
        // Generate payments table rows
        let paymentsTableRows = "";
        payments.forEach((payment, index) => {
            var _a, _b, _c;
            const paymentDate = payment.paidAt || payment.createdAt;
            const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString() : "N/A";
            paymentsTableRows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${payment.stripePaymentIntentId || "N/A"}</td>
                    <td>${((_a = payment.userId) === null || _a === void 0 ? void 0 : _a.name) || "N/A"}</td>
                    <td>${((_b = payment.hostId) === null || _b === void 0 ? void 0 : _b.name) || "N/A"}</td>
                    <td>${((_c = payment.propertyId) === null || _c === void 0 ? void 0 : _c.title) || "N/A"}</td>
                    <td class="text-right">£${(payment.totalAmount || 0).toFixed(2)}</td>
                    <td class="text-right">£${(payment.commissionAmount || 0).toFixed(2)}</td>
                    <td class="text-right">£${(payment.bookingFee || 0).toFixed(2)}</td>
                    <td class="text-right">£${(payment.hostAmount || 0).toFixed(2)}</td>
                    <td><span class="status-badge status-${payment.status}">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span></td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        });
        // Replace template variables
        html = html
            .replace("{{fromDate}}", fromDateDisplay)
            .replace("{{toDate}}", toDateDisplay)
            .replace("{{reportDate}}", reportDate)
            .replace("{{reportTime}}", reportTime)
            .replace("{{totalRevenue}}", totals.totalRevenue.toFixed(2))
            .replace("{{totalCommission}}", totals.totalCommission.toFixed(2))
            .replace("{{totalBookingFees}}", totals.totalBookingFees.toFixed(2))
            .replace("{{totalExtraFees}}", totals.totalExtraFees.toFixed(2))
            .replace("{{totalPlatformTotal}}", totals.totalPlatformTotal.toFixed(2))
            .replace("{{totalHostEarnings}}", totals.totalHostEarnings.toFixed(2))
            .replace("{{totalTransactions}}", totals.totalTransactions.toString())
            .replace("{{paymentsTable}}", paymentsTableRows);
        // Generate PDF with Puppeteer
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = yield browser.newPage();
        yield page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = yield page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        });
        yield browser.close();
        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=admin-payments-report-${fromDate}-to-${toDate}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    }
    catch (error) {
        console.error("Error generating payments PDF:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.generatePaymentsPDF = generatePaymentsPDF;
exports.paymentTemplate = {
    generateHostSingleInvoicePDF,
    generateHostPaymentsPDF,
    // Admin Pdf Generator
    generatePaymentsPDF: exports.generatePaymentsPDF,
};
