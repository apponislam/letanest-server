export const messageNotificationTemplate = (data: any) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #f5f5f5; 
            margin: 0; 
            padding: 20px; 
        }
        .email { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #C9A94D 0%, #d4b85c 100%); 
            color: white; 
            padding: 20px; 
            text-align: center; 
        }
        .content { 
            padding: 30px; 
        }
        .btn { 
            background: linear-gradient(135deg, #C9A94D 0%, #d4b85c 100%); 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            margin: 10px 0; 
        }
        .footer { 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #eee; 
            background: #fafafa;
        }
        .preview-box {
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 6px; 
            font-style: italic;
            margin: 15px 0;
            border-left: 4px solid #C9A94D;
        }
        .status {
            padding: 8px 12px;
            border-radius: 4px;
            display: inline-block;
            font-size: 14px;
            margin-top: 10px;
        }
        .status-active {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .status-pending {
            background: #fff3e0;
            color: #f57c00;
        }
    </style>
</head>
<body>
    <div class="email">
        <div class="header">
            <h2 style="margin: 0;">New Message</h2>
        </div>
        
        <div class="content">
            <p>Hello ${data.name},</p>
            
            <p><strong>${data.senderName}</strong> sent you a message on Letanest:</p>
            
            <div class="preview-box">
                "${data.messagePreview}"
            </div>
            
            <a href="${data.conversationUrl}" class="btn">
                View Conversation
            </a>
            
            <div class="status ${data.replyAllowed ? "status-active" : "status-pending"}">
                ${data.replyAllowed ? "✓ You can reply now" : "⏳ Reply access pending"}
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">Letanest - Your trusted accommodation platform</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} Letanest. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;

// Reply Enabled Email Template
export const replyEnabledTemplate = (data: any) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #f5f5f5; 
            margin: 0; 
            padding: 20px; 
        }
        .email { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #C9A94D 0%, #d4b85c 100%); 
            color: white; 
            padding: 20px; 
            text-align: center; 
        }
        .content { 
            padding: 30px; 
            text-align: center;
        }
        .btn { 
            background: linear-gradient(135deg, #C9A94D 0%, #d4b85c 100%); 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            margin: 15px 0; 
        }
        .footer { 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #eee; 
            background: #fafafa;
        }
        .icon {
            font-size: 48px;
            margin: 20px 0;
            color: #C9A94D;
        }
    </style>
</head>
<body>
    <div class="email">
        <div class="header">
            <h2 style="margin: 0;">Reply Now Enabled</h2>
        </div>
        
        <div class="content">
            <div class="icon">✓</div>
            
            <p>Hello ${data.name},</p>
            
            <p>The host has responded to your message. You can now reply and continue the conversation.</p>
            
            <a href="${data.conversationUrl}" class="btn">
                Continue Conversation
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Click the button above to view the conversation and send your reply.
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">Letanest - Your trusted accommodation platform</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} Letanest. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;
