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
    const transporter = nodemailer.createTransport({
        host: config.mail.smtp_host,
        port: Number(config.mail.smtp_port),
        secure: true,
        auth: {
            user: config.mail.smtp_user,
            pass: config.mail.smtp_pass,
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
