import config from "../app/config";

export const newConversationTemplate = ({ name }: { name: string }) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0;
                padding: 0;
                background-color: #f8f9fa;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px;
                background-color: white;
            }
            .header { 
                background: #f4f4f4; 
                padding: 20px; 
                text-align: center;
                border-bottom: 3px solid #C9A94D;
            }
            .content { 
                padding: 30px 20px;
            }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #C9A94D; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 15px 0;
                font-weight: bold;
                border: none;
            }
            .button:hover {
                background: #b8963e;
            }
            .footer { 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #ddd; 
                color: #666; 
                font-size: 12px;
                text-align: center;
            }
            h2 {
                color: #C9A94D;
                margin: 0;
            }
            .highlight {
                color: #C9A94D;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Conversation Started</h2>
            </div>
            <div class="content">
                <p>Hello <span class="highlight">${name}</span>,</p>
                <p>A new conversation has been started with you.</p>
                <p>Please check your messages to respond.</p>
                <p style="text-align: center;">
                    <a href="${config.client_url}/messages" class="button" style="display: inline-block; padding: 14px 32px; background: #C9A94D; color: white !important; text-decoration: none !important; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; text-align: center; border: none;">View Conversation</a>
                </p>
            </div>
            <div class="footer">
                <p>Best regards,<br/><strong>Letanest Team</strong></p>
                <p>If you don't want to receive these notifications, you can disable them in your account dashboard.</p>
            </div>
        </div>
    </body>
    </html>`;
};
