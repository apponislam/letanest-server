"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../app/config"));
const sendVerificationEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, name, verificationUrl }) {
    const transporter = nodemailer_1.default.createTransport({
        host: config_1.default.mail.smtp_host,
        port: Number(config_1.default.mail.smtp_port),
        auth: {
            user: config_1.default.mail.smtp_user,
            pass: config_1.default.mail.smtp_pass,
        },
    });
    const html = `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="padding: 40px; text-align: center;">
            <h1 style="color: #333333; font-size: 28px; margin-bottom: 20px;">Verify Your Email</h1>
            <p style="color: #555555; font-size: 16px;">Hi <strong>${name}</strong>,</p>
            <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                Thank you for registering! Click the button below to verify your email address and activate your account.
            </p>
            <a href="${verificationUrl}" 
                style="display: inline-block; padding: 14px 28px; margin: 25px 0; background-color: #4CAF50; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background-color 0.3s;">
                Verify Email
            </a>
            <p style="color: #999999; font-size: 14px; margin-top: 20px;">
                If you did not create an account, just ignore this email.
            </p>
        </div>
    </div>
</div>
`;
    yield transporter.sendMail({
        from: `"MyApp" <${process.env.SMTP_USER}>`,
        to,
        subject: "Verify Your Email",
        html,
    });
});
exports.sendVerificationEmail = sendVerificationEmail;
