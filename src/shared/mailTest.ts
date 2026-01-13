import nodemailer from "nodemailer";
import config from "../app/config";

const isProduction = config.node_env === "production";

export const transporter = nodemailer.createTransport({
    host: config.mail.smtp_host,
    port: Number(config.mail.smtp_port),
    secure: isProduction && Number(config.mail.smtp_port) === 465,
    auth: {
        user: config.mail.smtp_user,
        pass: config.mail.smtp_pass,
    },
    tls: {
        rejectUnauthorized: isProduction,
    },
});

export const verifyMailConnection = async () => {
    if (config.node_env === "test") return;

    try {
        await transporter.verify();
        console.log("📧 Mail server connected");
    } catch (error: any) {
        console.error("❌ Mail server error:", error.message);
    }
};
