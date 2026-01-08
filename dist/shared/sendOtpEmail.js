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
exports.sendOtpEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../app/config"));
const emailTemplates_1 = require("./emailTemplates");
const sendOtpEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, name, otp }) {
    const transporter = nodemailer_1.default.createTransport({
        host: config_1.default.mail.smtp_host,
        port: Number(config_1.default.mail.smtp_port),
        secure: true,
        auth: {
            user: config_1.default.mail.smtp_user,
            pass: config_1.default.mail.smtp_pass,
        },
    });
    const html = (0, emailTemplates_1.otpEmailTemplate)({ name, otp });
    yield transporter.sendMail({
        from: `"Letanest" <${config_1.default.mail.smtp_user}>`,
        to,
        subject: "Your Letanest Password Reset OTP",
        html,
    });
});
exports.sendOtpEmail = sendOtpEmail;
