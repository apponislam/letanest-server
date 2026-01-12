import nodemailer from "nodemailer";
import config from "../app/config";
import { newConversationTemplate } from "./emailMessageTemplates";

interface NewConversationMailOptions {
    to: string;
    name: string;
}

export const sendNewConversationEmail = async ({ to, name }: NewConversationMailOptions) => {
    const transporter = nodemailer.createTransport({
        host: config.mail.smtp_host,
        port: Number(config.mail.smtp_port),
        secure: true,
        auth: {
            user: config.mail.smtp_user,
            pass: config.mail.smtp_pass,
        },
    });

    const html = newConversationTemplate({ name });

    await transporter.sendMail({
        from: `"Letanest" <${config.mail.smtp_user}>`,
        to,
        subject: "New Conversation Started",
        html,
    });
};

interface MessageNotificationOptions {
    to: string;
    receiverName: string;
    senderName: string;
    messageType: string;
    subject: string;
    template: Function;
}

export const sendMessageNotificationEmail = async ({ to, receiverName, senderName, messageType, subject, template }: MessageNotificationOptions) => {
    const transporter = nodemailer.createTransport({
        host: config.mail.smtp_host,
        port: Number(config.mail.smtp_port),
        secure: true,
        auth: {
            user: config.mail.smtp_user,
            pass: config.mail.smtp_pass,
        },
    });

    const html = template(receiverName, senderName);

    await transporter.sendMail({
        from: `"Letanest" <${config.mail.smtp_user}>`,
        to,
        subject,
        html,
    });

    console.log(`📧 ${messageType} email sent to ${to}`);
};
