import { Document, Types } from "mongoose";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import { PaymentModel } from "./payment.model";
import { Request, Response } from "express";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";

// Define base interfaces
interface IUser {
    name: string;
    email: string;
}

interface IHost {
    name: string;
    email: string;
}

interface IProperty {
    title: string;
}

interface IPayment {
    userId: Types.ObjectId | IUser;
    hostId: Types.ObjectId | IHost;
    propertyId: Types.ObjectId | IProperty;
    status: string;
    createdAt: Date;
    paidAt?: Date;
    stripePaymentIntentId?: string;
    hostAmount?: number;
    agreedFee?: number;
    bookingFee?: number;
    extraFee?: number;
    commissionAmount?: number;
    commissionRate?: number;
}

interface IPaymentDocument extends IPayment, Document {}

const generateHostSingleInvoicePDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const payment = await PaymentModel.findById(id).populate("userId", "name email phone").populate("hostId", "name email phone").populate("propertyId", "title address city state").exec();

        if (!payment) {
            res.status(404).json({ error: "Payment not found" });
            return;
        }

        // Type assertions for populated fields
        const populatedPayment = payment as any;

        // const templatePath = path.join(__dirname, "../../../../public/templates/HostSingleinvoiceTemplate.html");
        const templatePath = path.resolve(process.cwd(), "public/templates/HostSingleinvoiceTemplate.html");

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }

        let html = fs.readFileSync(templatePath, "utf8");

        const statusClass = `status-${payment.status.toLowerCase()}`;

        // Date handling
        const paidAtDate = new Date(payment.paidAt || payment.createdAt!);
        const createdAtDate = new Date(payment.createdAt!);

        // Format numbers properly
        const hostAmount = payment.hostAmount?.toFixed(2) || "0.00";
        const agreedFee = payment.agreedFee?.toFixed(2) || "0.00";
        const bookingFee = payment.bookingFee?.toFixed(2) || "0.00";
        const extraFee = payment.extraFee?.toFixed(2) || "0.00";
        const commissionAmount = payment.commissionAmount?.toFixed(2) || "0.00";
        const commissionRate = payment.commissionRate?.toString() || "0";

        // Get property address
        const propertyAddress = populatedPayment.propertyId?.address ? `${populatedPayment.propertyId.address}, ${populatedPayment.propertyId.city || ""}, ${populatedPayment.propertyId.state || ""}`.replace(/,\s*,/g, ",").replace(/,\s*$/, "") : "N/A";

        html = html
            .replace("{{propertyTitle}}", populatedPayment.propertyId?.title || "N/A")
            .replace("{{propertyAddress}}", propertyAddress)
            .replace("{{hostName}}", populatedPayment.hostId?.name || "N/A")
            .replace("{{hostEmail}}", populatedPayment.hostId?.email || "N/A")
            .replace("{{hostPhone}}", populatedPayment.hostId?.phone || "N/A")
            .replace("{{guestName}}", populatedPayment.userId?.name || "N/A")
            .replace("{{guestEmail}}", populatedPayment.userId?.email || "N/A")
            .replace("{{guestPhone}}", populatedPayment.userId?.phone || "N/A")
            .replace(
                "{{date}}",
                createdAtDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            )
            .replace(
                "{{paymentDate}}",
                paidAtDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            )
            .replace(
                "{{invoiceDate}}",
                new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            )
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

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "10px",
                right: "10px",
                bottom: "10px",
                left: "10px",
            },
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=receipt-${id}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Multiple payments PDF with date range
const generateHostPaymentsPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fromDate, toDate } = req.body;
        const hostId = (req as any).user._id; // Get host ID from auth middleware

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
        const payments = await PaymentModel.find({
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
        const templatePath = path.resolve(process.cwd(), "public/templates/HostInvoicesTemplate.html");

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }

        let html = fs.readFileSync(templatePath, "utf8");

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
            const populatedPayment = payment as any;
            const paymentDate = new Date(payment.paidAt || payment.createdAt!).toLocaleDateString("en-US");

            paymentsTableRows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${populatedPayment.propertyId?.title || "N/A"}</td>
                    <td>${populatedPayment.userId?.name || "N/A"}</td>
                    <td>${paymentDate}</td>
                    <td>$${(payment.hostAmount || 0).toFixed(2)}</td>
                    <td>${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</td>
                </tr>
            `;
        });

        // Replace template variables
        html = html.replace("{{fromDate}}", fromDateDisplay).replace("{{toDate}}", toDateDisplay).replace("{{reportDate}}", reportDate).replace("{{totalAmount}}", totalAmount.toFixed(2)).replace("{{totalBookings}}", totalBookings.toString()).replace("{{paymentsTable}}", paymentsTableRows);

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=payments-report-${fromDate}-to-${toDate}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error("Error generating payments PDF:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Admin Pdf

/**
 * Generate PDF for payments within date range using Puppeteer
 */
export const generatePaymentsPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fromDate, toDate } = req.body;

        if (!fromDate || !toDate) {
            res.status(400).json({ error: "From date and to date are required" });
            return;
        }

        // Query payments within date range
        const payments = await PaymentModel.find({
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
        const totals = payments.reduce(
            (acc, payment) => ({
                totalRevenue: acc.totalRevenue + (payment.totalAmount || 0),
                totalCommission: acc.totalCommission + (payment.commissionAmount || 0),
                totalBookingFees: acc.totalBookingFees + (payment.bookingFee || 0),
                totalExtraFees: acc.totalExtraFees + (payment.extraFee || 0),
                totalPlatformTotal: acc.totalPlatformTotal + (payment.platformTotal || 0),
                totalHostEarnings: acc.totalHostEarnings + (payment.hostAmount || 0),
                totalTransactions: acc.totalTransactions + 1,
            }),
            {
                totalRevenue: 0,
                totalCommission: 0,
                totalBookingFees: 0,
                totalExtraFees: 0,
                totalPlatformTotal: 0,
                totalHostEarnings: 0,
                totalTransactions: 0,
            },
        );

        const templatePath = path.resolve(process.cwd(), "public/templates/AdminPaymentsReport.html");
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }

        let html = fs.readFileSync(templatePath, "utf8");

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
            const paymentDate = payment.paidAt || payment.createdAt;
            const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString() : "N/A";

            paymentsTableRows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${payment.stripePaymentIntentId || "N/A"}</td>
                    <td>${(payment.userId as any)?.name || "N/A"}</td>
                    <td>${(payment.hostId as any)?.name || "N/A"}</td>
                    <td>${(payment.propertyId as any)?.title || "N/A"}</td>
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
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        });

        await browser.close();

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=admin-payments-report-${fromDate}-to-${toDate}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error("Error generating payments PDF:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const paymentTemplate = {
    generateHostSingleInvoicePDF,
    generateHostPaymentsPDF,
    // Admin Pdf Generator
    generatePaymentsPDF,
};
