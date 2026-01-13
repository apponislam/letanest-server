import nodemailer from "nodemailer";
import config from "../../config";
import { contactReplyTemplate } from "../../../shared/emailTemplates";

interface ContactReplyOptions {
    to: string;
    name: string;
    originalMessage: string;
    reply: string;
}

export const sendContactReply = async ({ to, name, originalMessage, reply }: ContactReplyOptions) => {
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

    const html = contactReplyTemplate({ name, message: originalMessage, reply });

    await transporter.sendMail({
        from: `"Letanest Support" <${config.mail.smtp_user}>`,
        to,
        subject: "Re: Your Message to Letanest",
        html,
    });
};
