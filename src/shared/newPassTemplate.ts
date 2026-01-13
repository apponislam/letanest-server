import nodemailer from "nodemailer";
import config from "../app/config";

export const sendPasswordResetEmail = async ({ to, name, newPassword }: { to: string; name: string; newPassword: string }) => {
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

    const html = passwordResetEmailTemplate({ name, newPassword });

    await transporter.sendMail({
        from: `"Letanest Support" <${config.mail.smtp_user}>`,
        to,
        subject: "Your Password Has Been Reset",
        html,
    });
};

export const passwordResetEmailTemplate = ({ name, newPassword }: { name: string; newPassword: string }) => `
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
