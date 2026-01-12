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
        // secure: true,
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
