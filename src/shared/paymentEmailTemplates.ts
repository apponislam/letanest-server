import config from "../app/config";

export const bookingAndExtraFeeReceiptTemplate = ({ name, bookingId, bookingFee, extraFee, totalAmount, stripePaymentIntentId, paidAt }: { name: string; bookingId: string; bookingFee: number; extraFee: number; totalAmount: number; stripePaymentIntentId: string; paidAt: string }) => {
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
            .receipt-box {
                background: #f9f9f9;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 3px solid #C9A94D;
            }
            .receipt-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .receipt-total {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-top: 2px solid #ddd;
                font-weight: bold;
                color: #C9A94D;
                margin-top: 10px;
            }
            .info-item {
                margin: 5px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Payment Receipt - Booking Fee & Peace of Mind Fee</h2>
            </div>
            <div class="content">
                <p>Hello <span class="highlight">${name}</span>,</p>
                <p>Your payment for booking and peace of mind fees has been completed successfully.</p>
                
                <div class="receipt-box">
                    <div class="receipt-item">
                        <span>Booking Fee:</span>
                        <span> €${bookingFee}</span>
                    </div>
                    <div class="receipt-item">
                        <span>Peace of Mind Fee:</span>
                        <span> €${extraFee}</span>
                    </div>
                    <div class="receipt-total">
                        <span>Total Amount:</span>
                        <span> €${totalAmount}</span>
                    </div>
                </div>
                
                <div class="info-item"><strong>Booking ID:</strong> ${bookingId}</div>
                <div class="info-item"><strong>Transaction ID:</strong> ${stripePaymentIntentId}</div>
                <div class="info-item"><strong>Payment Date:</strong> ${new Date(paidAt).toLocaleDateString()}</div>
                
                <p>This receipt confirms your payment for booking and peace of mind services.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br/><strong>Letanest Team</strong></p>
                <p>Please save this receipt for your records.</p>
            </div>
        </div>
    </body>
    </html>`;
};

export const agreedFeeReceiptTemplate = ({ name, bookingId, agreedFee, stripePaymentIntentId, paidAt }: { name: string; bookingId: string; agreedFee: number; stripePaymentIntentId: string; paidAt: string }) => {
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
            .receipt-box {
                background: #f9f9f9;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 3px solid #C9A94D;
            }
            .receipt-item {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                font-size: 18px;
                font-weight: bold;
                color: #C9A94D;
            }
            .info-item {
                margin: 5px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Payment Receipt - Property Fee</h2>
            </div>
            <div class="content">
                <p>Hello <span class="highlight">${name}</span>,</p>
                <p>Your payment for the property fee has been completed successfully.</p>
                
                <div class="receipt-box">
                    <div class="receipt-item">
                        <span>Property Fee:</span>
                        <span> €${agreedFee}</span>
                    </div>
                </div>
                
                <div class="info-item"><strong>Booking ID:</strong> ${bookingId}</div>
                <div class="info-item"><strong>Transaction ID:</strong> ${stripePaymentIntentId}</div>
                <div class="info-item"><strong>Payment Date:</strong> ${new Date(paidAt).toLocaleDateString()}</div>
                
                <p>This receipt confirms your payment for the property rental fee.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br/><strong>Letanest Team</strong></p>
                <p>Please save this receipt for your records.</p>
            </div>
        </div>
    </body>
    </html>`;
};
