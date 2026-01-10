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
exports.passwordResetEmailTemplate = exports.sendPasswordResetEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../app/config"));
const sendPasswordResetEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, name, newPassword }) {
    const transporter = nodemailer_1.default.createTransport({
        host: config_1.default.mail.smtp_host,
        port: Number(config_1.default.mail.smtp_port),
        secure: true,
        auth: {
            user: config_1.default.mail.smtp_user,
            pass: config_1.default.mail.smtp_pass,
        },
    });
    const html = (0, exports.passwordResetEmailTemplate)({ name, newPassword });
    yield transporter.sendMail({
        from: `"Letanest Support" <${config_1.default.mail.smtp_user}>`,
        to,
        subject: "Your Password Has Been Reset",
        html,
    });
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const passwordResetEmailTemplate = ({ name, newPassword }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            color: #C9A94D;
        }
        .password-box {
            background: #fff9e6;
            padding: 15px;
            border-radius: 5px;
            border: 2px solid #C9A94D;
            margin: 20px 0;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .warning {
            background: #ffe6e6;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #ff9999;
            margin: 20px 0;
            color: #cc0000;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset by Administrator</h2>
        </div>
        
        <p>Hi ${name},</p>
        
        <p>Your password has been reset by an administrator. Here is your new password:</p>
        
        <div class="password-box">
            ${newPassword}
        </div>
        
        <div class="warning">
            <p><strong>Important:</strong> Please login immediately and change your password for security reasons.</p>
        </div>
        
        <p>If you didn't request this password reset, please contact support immediately.</p>
        
        <div class="footer">
            <p>Letanest Team</p>
            <p>support@letanest.com</p>
        </div>
    </div>
</body>
</html>
`;
exports.passwordResetEmailTemplate = passwordResetEmailTemplate;
