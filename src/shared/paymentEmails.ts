import nodemailer from "nodemailer";
import config from "../app/config";
import { agreedFeeReceiptTemplate, bookingAndExtraFeeReceiptTemplate } from "./paymentEmailTemplates";

export const sendBookingFeeReceiptEmail = async ({ to, name, bookingId, bookingFee, extraFee, totalAmount, stripePaymentIntentId, paidAt }: { to: string; name: string; bookingId: string; bookingFee: number; extraFee: number; totalAmount: number; stripePaymentIntentId: string; paidAt: string }) => {
    const isProduction = config.node_env === "production";
    const transporter = nodemailer.createTransport({
        host: config.mail.smtp_host,
        port: Number(config.mail.smtp_port),
        secure: isProduction && Number(config.mail.smtp_port) === 465,
        auth: {
            user: config.mail.smtp_user,
            pass: config.mail.smtp_pass,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const html = bookingAndExtraFeeReceiptTemplate({
        name,
        bookingId,
        bookingFee,
        extraFee,
        totalAmount,
        stripePaymentIntentId,
        paidAt,
    });

    await transporter.sendMail({
        from: `"Letanest" <${config.mail.smtp_user}>`,
        to,
        subject: "Payment Receipt - Booking Fee & Peace of Mind Fee",
        html,
    });
};

export const sendAgreedFeeReceiptEmail = async ({ to, name, bookingId, agreedFee, stripePaymentIntentId, paidAt }: { to: string; name: string; bookingId: string; agreedFee: number; stripePaymentIntentId: string; paidAt: string }) => {
    const isProduction = config.node_env === "production";
    const transporter = nodemailer.createTransport({
        host: config.mail.smtp_host,
        port: Number(config.mail.smtp_port),
        secure: isProduction && Number(config.mail.smtp_port) === 465,
        auth: {
            user: config.mail.smtp_user,
            pass: config.mail.smtp_pass,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const html = agreedFeeReceiptTemplate({
        name,
        bookingId,
        agreedFee,
        stripePaymentIntentId,
        paidAt,
    });

    await transporter.sendMail({
        from: `"Letanest" <${config.mail.smtp_user}>`,
        to,
        subject: "Payment Receipt - Property Fee",
        html,
    });
};
