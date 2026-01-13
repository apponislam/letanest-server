import nodemailer from "nodemailer";
import config from "../app/config";
import { verificationEmailTemplate } from "./emailTemplates";

interface VerificationMailOptions {
    to: string;
    name: string;
    verificationUrl: string;
}

export const sendVerificationEmail = async ({ to, name, verificationUrl }: VerificationMailOptions) => {
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

    const html = verificationEmailTemplate({ name, verificationUrl });

    await transporter.sendMail({
        from: `"Letanest" <${config.mail.smtp_user}>`,
        to,
        subject: "Verify Your Letanest Account",
        html,
    });
};
