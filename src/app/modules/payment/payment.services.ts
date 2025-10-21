import { Types } from "mongoose";
import httpStatus from "http-status";
import { PropertyModel } from "../property/properties.model";
import { CreatePaymentData } from "./payment.interfaces";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { stripeService } from "../subscription/stripe.services";
import { PaymentModel } from "./payment.model";
import { messageServices } from "../messages/message.services";
import { Message } from "../messages/messages.model";
import PDFDocument from "pdfkit";

/**
 * Create a new payment
 */
const createPayment = async (data: CreatePaymentData) => {
    // Validate required fields
    if (!data.propertyId || !data.userId || !data.conversationId || !data.messageId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
    }

    const message = await Message.findById(data.messageId);

    if (message?.type !== "offer") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Already payment done or cancelled");
    }

    if (data.totalAmount <= 0 || data.agreedFee <= 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid amount");
    }

    // Get host's Stripe account
    const property = await PropertyModel.findById(data.propertyId).populate("createdBy");
    if (!property) {
        throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
    }

    const host = await UserModel.findById(property.createdBy);
    if (!host?.hostStripeAccount?.stripeAccountId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Host Stripe account not found");
    }

    // Get guest's Stripe customer
    const guest = await UserModel.findById(data.userId);
    if (!guest) {
        throw new ApiError(httpStatus.NOT_FOUND, "Guest user not found");
    }

    let stripeCustomerId = guest.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
        try {
            // Create Stripe customer
            const stripeCustomer = await stripeService.createCustomer2({
                email: guest.email,
                name: guest.name,
                metadata: {
                    userId: guest._id.toString(),
                },
            });

            stripeCustomerId = stripeCustomer.id;

            // Update user with Stripe customer ID
            await UserModel.findByIdAndUpdate(data.userId, {
                stripeCustomerId: stripeCustomerId,
            });

            console.log("✅ Created new Stripe customer:", stripeCustomerId);
        } catch (error) {
            console.error("Error creating Stripe customer:", error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create payment customer");
        }
    }

    // Calculate commission (10% of agreedFee)
    const commissionRate = 10;
    const commissionAmount = data.agreedFee * (commissionRate / 100);
    const hostAmount = data.agreedFee - commissionAmount;

    const platformTotal = commissionAmount + data.bookingFee + (data.extraFee || 0);

    // Calculate platform fees (commission + booking fee)
    const platformFees = platformTotal;

    // Create Stripe Connect payment - use agreedFee as base amount
    const paymentIntent = await stripeService.createConnectPayment(
        data.agreedFee, // Base amount for host + commission
        host.hostStripeAccount.stripeAccountId,
        stripeCustomerId,
        platformFees // Total platform fees
    );

    // Create payment record
    const payment = await PaymentModel.create({
        stripePaymentIntentId: paymentIntent.id,
        agreedFee: data.agreedFee,
        bookingFee: data.bookingFee,
        extraFee: data.extraFee || 0,
        totalAmount: data.totalAmount,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        hostAmount: hostAmount,
        platformTotal,
        userId: new Types.ObjectId(data.userId),
        propertyId: new Types.ObjectId(data.propertyId),
        conversationId: new Types.ObjectId(data.conversationId),
        messageId: new Types.ObjectId(data.messageId),
        hostId: new Types.ObjectId(host._id),
        status: "pending",
        checkInDate: data.checkInDate || null,
        checkOutDate: data.checkOutDate || null,
    });

    return {
        payment,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
};

/**
 * Confirm payment
 */
const confirmPayment = async (paymentIntentId: string, paymentMethodId: string) => {
    if (!paymentIntentId || !paymentMethodId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Payment intent ID and payment method ID are required");
    }

    // Confirm payment with Stripe
    const paymentIntent = await stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId);

    // Update payment status based on Stripe status
    let status = "pending";

    switch (paymentIntent.status) {
        case "succeeded":
            status = "completed";
            break;
        case "requires_action":
        case "requires_confirmation":
        case "requires_payment_method":
            status = "requires_action";
            break;
        case "canceled":
            status = "canceled";
            break;
        case "processing":
            status = "processing";
            break;
        default:
            status = "pending";
    }

    const payment = await PaymentModel.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        {
            status: status,
            paidAt: paymentIntent.status === "succeeded" ? new Date() : undefined,
            stripePaymentStatus: paymentIntent.status,
        },
        { new: true }
    );

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment record not found");
    }

    const updateAccept = await messageServices.acceptOffer(payment.messageId.toString(), payment.conversationId.toString(), payment.userId.toString());
    console.log(updateAccept);

    return payment;
};

/**
 * Get payment by ID
 */
const getPaymentById = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid payment ID");
    }

    const payment = await PaymentModel.findById(id).populate("userId", "name email").populate("propertyId", "propertyNumber title").populate("conversationId").populate("messageId");

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
    }

    return payment;
};

/**
 * Get payments by user ID (for guests)
 */
const getPaymentsByUser = async (userId: string, query: { page?: number; limit?: number }) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
        PaymentModel.find({ userId: new Types.ObjectId(userId) })
            .populate("hostId", "name email profileImg")
            .populate("propertyId", "title location coverPhoto propertyType amenities")
            .populate("messageId", "checkInDate checkOutDate") // Populate offer details
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        PaymentModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    return {
        payments,
        meta: {
            page,
            limit,
            total,
        },
    };
};

/**
 * Get all payments (for admin)
 */
const getAllPayments = async (filters: any = {}, options: any = {}) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Build filter query
    const filterQuery: any = {};

    if (filters.status) {
        filterQuery.status = filters.status;
    }

    if (filters.propertyId) {
        filterQuery.propertyId = new Types.ObjectId(filters.propertyId);
    }

    if (filters.userId) {
        filterQuery.userId = new Types.ObjectId(filters.userId);
    }

    if (filters.startDate && filters.endDate) {
        filterQuery.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate),
        };
    }

    const payments = await PaymentModel.find(filterQuery)
        .populate("userId", "name email phone")
        .populate({
            path: "propertyId",
            select: "createdBy propertyNumber title address",
            populate: {
                path: "createdBy",
                select: "name",
            },
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

    const total = await PaymentModel.countDocuments(filterQuery);

    return {
        payments,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get payment totals and statistics
 */
const getPaymentTotals = async () => {
    const totals = await PaymentModel.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                totalCommission: { $sum: "$commissionAmount" },
                totalBookingFees: { $sum: "$bookingFee" },
                totalExtraFees: { $sum: "$extraFee" },
                totalPlatformTotal: { $sum: "$platformTotal" },
                totalHostEarnings: { $sum: "$hostAmount" },
                totalTransactions: { $sum: 1 },
                completedTransactions: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
            },
        },
    ]);

    // If no payments exist, return zeros
    if (totals.length === 0) {
        return {
            totalRevenue: 0,
            totalCommission: 0,
            totalBookingFees: 0,
            totalExtraFees: 0,
            totalPlatformTotal: 0,
            totalHostEarnings: 0,
            totalTransactions: 0,
            completedTransactions: 0,
        };
    }

    return totals[0];
};

/**
 * Get payment statistics (for admin dashboard)
 */
const getPaymentStatistics = async () => {
    const totalPayments = await PaymentModel.countDocuments();
    const completedPayments = await PaymentModel.countDocuments({ status: "completed" });
    const pendingPayments = await PaymentModel.countDocuments({ status: "pending" });
    const failedPayments = await PaymentModel.countDocuments({ status: "failed" });

    const totalRevenue = await PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]);

    const platformRevenue = await PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$platformTotal" } } }]);

    const hostRevenue = await PaymentModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$hostAmount" } } }]);

    // Monthly revenue
    const monthlyRevenue = await PaymentModel.aggregate([
        { $match: { status: "completed" } },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                total: { $sum: "$totalAmount" },
                platform: { $sum: "$platformTotal" },
                host: { $sum: "$hostAmount" },
            },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    return {
        totals: {
            payments: totalPayments,
            completed: completedPayments,
            pending: pendingPayments,
            failed: failedPayments,
        },
        revenue: {
            total: totalRevenue[0]?.total || 0,
            platform: platformRevenue[0]?.total || 0,
            host: hostRevenue[0]?.total || 0,
        },
        monthly: monthlyRevenue,
    };
};

/**
 * Get payments by host ID
 */
const getPaymentsByHost = async (hostId: string, query: { page?: number; limit?: number }) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [payments, total, totalAmountResult] = await Promise.all([
        PaymentModel.find({ hostId: new Types.ObjectId(hostId) })
            .populate("userId", "name email profileImg")
            .populate("propertyId", "title location coverPhoto propertyType")
            .populate("messageId", "checkInDate checkOutDate")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        PaymentModel.countDocuments({ hostId: new Types.ObjectId(hostId) }),
        // Calculate total hostAmount
        PaymentModel.aggregate([
            {
                $match: {
                    hostId: new Types.ObjectId(hostId),
                    status: "completed", // Only sum completed payments
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$hostAmount" },
                },
            },
        ]),
    ]);

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

    return {
        payments,
        meta: {
            page,
            limit,
            total,
            totalAmount,
        },
    };
};

/**
 * Generate PDF for payments within date range
 */
const generatePaymentsPDF = async (fromDate: string, toDate: string) => {
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
        throw new ApiError(httpStatus.NOT_FOUND, "No payments found in the selected date range");
    }

    // Create PDF document with proper margins
    const doc = new PDFDocument({
        margin: 40,
        size: "A4",
        bufferPages: true,
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));

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
        }
    );

    // ===== HEADER SECTION =====
    doc.fillColor("#C9A94D")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("TRANSACTION REPORT", 40, 40, { align: "center", width: doc.page.width - 80 });

    // Date range
    doc.fillColor("#666666")
        .fontSize(12)
        .font("Helvetica")
        .text(`Date Range: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`, 40, 75, {
            align: "center",
            width: doc.page.width - 80,
        });

    let yPosition = 110;

    // ===== SUMMARY SECTION =====
    doc.fillColor("#C9A94D").fontSize(18).font("Helvetica-Bold").text("Summary", 40, yPosition);
    yPosition += 30;

    // Auto-fit box height dynamically
    const topPadding = 25;
    const bottomPadding = 25;
    const lineSpacing = 28;
    const summaryItemsCount = 5; // commission, booking, extra, owner, host
    const summaryBoxHeight = topPadding + bottomPadding + 35 + summaryItemsCount * lineSpacing + 25;

    // Background box
    doc.rect(40, yPosition, doc.page.width - 80, summaryBoxHeight)
        .fillColor("#2D3546")
        .fill();

    // Start Y inside box
    let currentY = yPosition + topPadding;

    // Total Payments (main highlight)
    doc.fillColor("#C9A94D")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("Total Payments:", 60, currentY)
        .text(`£${totals.totalRevenue.toFixed(2)}`, doc.page.width - 120, currentY, { align: "right" });

    currentY += 30;

    // Gold separator line
    doc.moveTo(60, currentY)
        .lineTo(doc.page.width - 60, currentY)
        .strokeColor("#C9A94D")
        .lineWidth(1)
        .stroke();

    currentY += 15;

    // Secondary items (light gold text, consistent spacing)
    const summaryItems = [
        { label: "Commissions:", value: `£${totals.totalCommission.toFixed(2)}` },
        { label: "Booking Fees:", value: `£${totals.totalBookingFees.toFixed(2)}` },
        { label: "Extra Fees:", value: `£${totals.totalExtraFees.toFixed(2)}` },
    ];

    summaryItems.forEach((item) => {
        doc.fillColor("#C9A94D")
            .font("Helvetica")
            .fontSize(12)
            .text(item.label, 60, currentY)
            .text(item.value, doc.page.width - 120, currentY, { align: "right" });
        currentY += lineSpacing;
    });

    // Second separator
    doc.moveTo(60, currentY - 8)
        .lineTo(doc.page.width - 60, currentY - 8)
        .strokeColor("#C9A94D")
        .lineWidth(1)
        .stroke();

    currentY += 10;

    // Owner Total & Host Received (bold)
    const boldItems = [
        { label: "Owner Total:", value: `£${totals.totalPlatformTotal.toFixed(2)}` },
        { label: "Host Received:", value: `£${totals.totalHostEarnings.toFixed(2)}` },
    ];

    boldItems.forEach((item) => {
        doc.fillColor("#C9A94D")
            .font("Helvetica-Bold")
            .fontSize(12)
            .text(item.label, 60, currentY)
            .text(item.value, doc.page.width - 120, currentY, { align: "right" });
        currentY += lineSpacing;
    });

    yPosition += summaryBoxHeight + 40;

    // ===== TRANSACTION DETAILS SECTION =====
    // Check if we need a new page before transactions
    if (yPosition > 500) {
        doc.addPage();
        yPosition = 40;
    }

    doc.fillColor("#C9A94D").fontSize(18).font("Helvetica-Bold").text("Transaction Details", 40, yPosition);

    yPosition += 30;

    // Table headers - WIDER COLUMNS
    const headerY = yPosition;

    // WIDER COLUMN WIDTHS to fit content properly
    const columnWidths = [100, 90, 90, 70, 70, 80]; // Increased Payment ID and name columns
    const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

    // Header background - DARK BLUE
    doc.rect(40, headerY, totalTableWidth, 25)
        .fillColor("#14213D") // Dark blue background
        .fill();

    // Header text - WHITE TEXT
    doc.fillColor("#FFFFFF") // White text for headers
        .fontSize(9)
        .font("Helvetica-Bold");

    let headerX = 45;
    const headers = ["Payment ID", "Guest", "Host", "Amount", "Status", "Date"];

    headers.forEach((header, i) => {
        doc.text(header, headerX, headerY + 8, {
            width: columnWidths[i] - 10,
            align: "left",
        });
        headerX += columnWidths[i];
    });

    yPosition = headerY + 35;

    // Transaction rows
    payments.forEach((payment, index) => {
        // Check if we need a new page
        if (yPosition > doc.page.height - 80) {
            doc.addPage();
            yPosition = 40;

            // Add table header to new page
            const newHeaderY = yPosition;
            doc.rect(40, newHeaderY, totalTableWidth, 25).fillColor("#14213D").fill();

            let newHeaderX = 45;
            headers.forEach((header, i) => {
                doc.fillColor("#FFFFFF")
                    .fontSize(9)
                    .font("Helvetica-Bold")
                    .text(header, newHeaderX, newHeaderY + 8, {
                        width: columnWidths[i] - 10,
                        align: "left",
                    });
                newHeaderX += columnWidths[i];
            });

            yPosition = newHeaderY + 35;
        }

        // Safe date conversion
        const paymentDate = payment.paidAt || payment.createdAt;
        const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString() : "N/A";

        // FULL Payment ID (no truncation) with wider column
        const paymentId = payment.stripePaymentIntentId || "N/A";

        const row = [
            paymentId, // FULL Payment ID
            (payment.userId as any)?.name || "N/A",
            (payment.hostId as any)?.name || "N/A",
            `£${payment.totalAmount}`,
            payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
            formattedDate,
        ];

        // Alternate row background - DARK BACKGROUNDS
        if (index % 2 === 0) {
            doc.rect(40, yPosition - 5, totalTableWidth, 20)
                .fillColor("#1a2030") // Dark gray background
                .fill();

            // WHITE TEXT for dark background
            doc.fillColor("#FFFFFF");
        } else {
            // Lighter background for alternate rows
            doc.rect(40, yPosition - 5, totalTableWidth, 20)
                .fillColor("#2D3546") // Same as summary background
                .fill();

            // GOLD TEXT for lighter background to ensure visibility
            doc.fillColor("#C9A94D");
        }

        doc.fontSize(8).font("Helvetica");

        let cellX = 45;
        row.forEach((cell, i) => {
            // Use smaller font for long payment IDs
            const fontSize = i === 0 && cell.length > 15 ? 7 : 8;
            doc.fontSize(fontSize).text(cell, cellX, yPosition, {
                width: columnWidths[i] - 10,
                align: "left",
                ellipsis: true, // Add ellipsis if text is too long
            });
            cellX += columnWidths[i];
        });

        yPosition += 25;
    });

    // ===== FOOTER =====
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);

        // Page number - GOLD TEXT
        doc.fillColor("#C9A94D")
            .fontSize(10)
            .text(`Page ${i + 1} of ${pageCount}`, 40, doc.page.height - 30, { align: "center", width: doc.page.width - 80 });

        // Generated date - GRAY TEXT
        doc.fillColor("#666666")
            .fontSize(8)
            .text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 40, doc.page.height - 15, { align: "center", width: doc.page.width - 80 });
    }

    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on("error", (error) => {
            reject(error);
        });
    });
};

export const paymentServices = {
    createPayment,
    confirmPayment,
    getPaymentById,
    getPaymentsByUser,
    // For admin
    getAllPayments,
    getPaymentTotals,
    getPaymentStatistics,
    generatePaymentsPDF,
    // For Host
    getPaymentsByHost,
};
