import nodemailer from "nodemailer";
import config from "../app/config";
import { otpEmailTemplate } from "./emailTemplates";

interface OtpMailOptions {
    to: string;
    name: string;
    otp: string;
}

export const sendOtpEmail = async ({ to, name, otp }: OtpMailOptions) => {
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

    const html = otpEmailTemplate({ name, otp });

    await transporter.sendMail({
        from: `"Letanest" <${config.mail.smtp_user}>`,
        to,
        subject: "Your Letanest Password Reset OTP",
        html,
    });
};
