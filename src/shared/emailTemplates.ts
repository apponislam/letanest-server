export const verificationEmailTemplate = ({ name, verificationUrl }: { name: string; verificationUrl: string }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #C9A94D 0%, #d4b85c 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        
        .greeting {
            font-size: 18px;
            color: #fff;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .verification-button {
            display: inline-block;
            background: linear-gradient(135deg, #C9A94D 0%, #d4b85c 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 8px 20px rgba(201, 169, 77, 0.3);
            transition: all 0.3s ease;
        }
        
        .verification-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(201, 169, 77, 0.4);
        }
        
        .verification-url {
            display: block;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            word-break: break-all;
            font-size: 14px;
            color: #666;
        }
        
        .footer {
            padding: 30px;
            background: #f8f9fa;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            color: #999;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #C9A94D;
            margin-bottom: 10px;
        }
        
        @media (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            
            .header, .content {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Letanest!</h1>
            <p>Your journey to amazing stays begins here</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hello <strong>${name}</strong>,</p>
            
            <p class="message">
                Thank you for choosing Letanest! To complete your registration and start exploring amazing properties, 
                please verify your email address by clicking the button below.
            </p>
            
            <a href="${verificationUrl}" class="verification-button">
                Verify Email Address
            </a>
            
            <p class="message" style="font-size: 14px;">
                This verification link will expire in 24 hours for security reasons.
            </p>
        </div>
        
        <div class="footer">
            <div class="logo">Letanest</div>
            <p>
                If you didn't create an account with Letanest, please ignore this email.<br>
                Need help? Contact our support team at support@letanest.com
            </p>
        </div>
    </div>
</body>
</html>
`;

export const otpEmailTemplate = ({ name, otp }: { name: string; otp: string }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #C9A94D 0%, #d4b85c 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            border: 2px dashed #C9A94D;
        }
        
        .otp-code {
            font-size: 42px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #C9A94D;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            margin: 10px 0;
        }
        
        .otp-label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }
        
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        
        .warning p {
            color: #856404;
            font-size: 14px;
            margin: 0;
        }
        
        .footer {
            padding: 30px;
            background: #f8f9fa;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            color: #999;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #C9A94D;
            margin-bottom: 10px;
        }
        
        .security-note {
            background: #e8f5e8;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        
        .security-note p {
            color: #2d5016;
            font-size: 14px;
            margin: 0;
        }
        
        @media (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            
            .header, .content {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 28px;
            }
            
            .otp-code {
                font-size: 32px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
            <p>Secure your account with this OTP</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hello <strong>${name}</strong>,</p>
            
            <p class="message">
                You requested to reset your password. Use the One-Time Password (OTP) below to verify your identity and create a new password.
            </p>
            
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-label">Valid for 10 minutes</div>
            </div>
            
            <div class="warning">
                <p>⚠️ <strong>Security Alert:</strong> Never share this OTP with anyone. Letanest will never ask for your OTP.</p>
            </div>
            
            <div class="security-note">
                <p>🔒 This OTP was generated for your security. If you didn't request this, please ignore this email.</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="logo">Letanest</div>
            <p>
                Need help? Contact our support team at support@letanest.com<br>
                © ${new Date().getFullYear()} Letanest. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;

// Email Template Contact

export const contactReplyTemplate = ({ name, message, reply }: { name: string; message: string; reply: string }) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: #14213D; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
        }
        .content { 
            background: #f9f9f9; 
            padding: 20px; 
            border-radius: 0 0 10px 10px; 
            border: 1px solid #ddd; 
        }
        .original-message { 
            background: white; 
            padding: 15px; 
            border-left: 4px solid #C9A94D; 
            margin: 15px 0; 
            border-radius: 5px; 
        }
        .reply-message { 
            background: #e8f4fd; 
            padding: 15px; 
            border-left: 4px solid #135E9A; 
            margin: 15px 0; 
            border-radius: 5px; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Letanest Support</h1>
    </div>
    <div class="content">
        <h2>Hello ${name},</h2>
        <p>Thank you for contacting Letanest. Here is our response to your message:</p>
        
        <div class="original-message">
            <strong>Your Original Message:</strong>
            <p>${message}</p>
        </div>
        
        <div class="reply-message">
            <strong>Our Response:</strong>
            <p>${reply}</p>
        </div>
        
        <p>If you have any further questions, please don't hesitate to contact us again.</p>
        
        <p>Best regards,<br>The Letanest Team</p>
    </div>
    <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Letanest. All rights reserved.</p>
    </div>
</body>
</html>
    `;
};
