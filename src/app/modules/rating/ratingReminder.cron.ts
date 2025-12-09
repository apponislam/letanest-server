import { CronJob } from "cron";
import mongoose from "mongoose";
import { PaymentModel } from "../payment/payment.model";
import { Conversation, Message } from "../messages/messages.model";

class ReviewReminderCron {
    private job: CronJob;

    constructor() {
        this.job = new CronJob("*/15 * * * *", this.sendReviewReminders.bind(this));
    }

    public start(): void {
        this.job.start();
        console.log("Review reminder cron job started");
    }

    public stop(): void {
        this.job.stop();
        console.log("Review reminder cron job stopped");
    }

    private async sendReviewReminders(): Promise<void> {
        try {
            console.log("=== Running review reminder cron ===");
            console.log("Current server time:", new Date().toISOString());

            // Get payments where review hasn't been sent yet
            const payments = await PaymentModel.find({
                status: "completed",
                reviewedSend: { $ne: true },
            }).populate("userId hostId propertyId");

            console.log(`Found ${payments.length} payments to check`);

            let sentCount = 0;
            let notReadyCount = 0;

            for (const payment of payments) {
                const shouldSend = await this.shouldSendReviewReminder(payment);
                if (shouldSend) {
                    console.log(`✓ Sending review for payment: ${payment._id}`);
                    await this.sendReviewReminder(payment);
                    sentCount++;
                } else {
                    notReadyCount++;
                }
            }

            console.log(`=== Summary: Sent ${sentCount}, Skipped ${notReadyCount} ===`);
        } catch (error) {
            console.error("Error in review reminder cron job:", error);
        }
    }

    private async shouldSendReviewReminder(payment: any): Promise<boolean> {
        try {
            // Get the message with checkOutDate
            const message = await Message.findById(payment.messageId);
            if (!message || !message.checkOutDate) {
                console.log(`Payment ${payment._id}: No message or checkOutDate found`);
                return false;
            }

            const checkOutDate = new Date(message.checkOutDate);
            const today = new Date();

            console.log(`Payment ${payment._id}:`);
            console.log(`  checkOutDate: ${checkOutDate.toISOString()}`);
            console.log(`  today: ${today.toISOString()}`);

            // Check if checkOutDate has already passed
            if (checkOutDate > today) {
                console.log(`  Check-out is in the future, skipping`);
                return false;
            }

            // Calculate if 7 days have passed since checkOutDate
            const sevenDaysAfter = new Date(checkOutDate);
            sevenDaysAfter.setDate(checkOutDate.getDate() + 7);

            console.log(`  7 days after check-out: ${sevenDaysAfter.toISOString()}`);
            console.log(`  Should send? ${today >= sevenDaysAfter}`);

            return today >= sevenDaysAfter;
        } catch (error) {
            console.error(`Error checking shouldSend for payment ${payment._id}:`, error);
            return false;
        }
    }

    private async sendReviewReminder(payment: any): Promise<void> {
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                // Mark as sent first to prevent duplicates
                await PaymentModel.findByIdAndUpdate(payment._id, { reviewedSend: true }, { session });

                console.log(`Marked payment ${payment._id} as reviewedSend: true`);

                // Message 1: For GUEST to rate HOST
                const guestReviewMessage = await Message.create(
                    [
                        {
                            conversationId: payment.conversationId,
                            sender: payment.hostId._id,
                            type: "review",
                            text: ``,
                            propertyId: payment.propertyId._id.toString(),
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        },
                    ],
                    { session }
                );

                // Message 2: For HOST to rate GUEST
                const hostReviewMessage = await Message.create(
                    [
                        {
                            conversationId: payment.conversationId,
                            sender: payment.userId._id,
                            type: "review",
                            text: ``,
                            propertyId: payment.propertyId._id.toString(),
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        },
                    ],
                    { session }
                );

                // Update conversation
                await Conversation.findByIdAndUpdate(
                    payment.conversationId,
                    {
                        lastMessage: hostReviewMessage[0]._id,
                    },
                    { session }
                );

                console.log(`✓ Sent 2 review messages for payment ${payment._id}`);
            });
        } catch (error) {
            console.error(`Error sending review reminder for payment ${payment._id}:`, error);
            throw error;
        } finally {
            await session.endSession();
        }
    }
}

export const reviewReminderCron = new ReviewReminderCron();

// import { CronJob } from "cron";
// import mongoose from "mongoose";
// import { PaymentModel } from "../payment/payment.model";
// import { Conversation, Message } from "../messages/messages.model";

// class ReviewReminderCron {
//     private job: CronJob;

//     constructor() {
//         // this.job = new CronJob("*/15 * * * *", this.sendReviewReminders.bind(this));
//         this.job = new CronJob("*/10 * * * * *", this.sendReviewReminders.bind(this));
//     }

//     public start(): void {
//         this.job.start();
//         console.log("Review reminder cron job started");
//     }

//     public stop(): void {
//         this.job.stop();
//         console.log("Review reminder cron job stopped");
//     }

//     private async sendReviewReminders(): Promise<void> {
//         try {
//             console.log("Running review reminder cron job...");

//             // Get all completed payments where reviewedSend is not true
//             const payments = await PaymentModel.find({
//                 status: "completed",
//                 $or: [{ reviewedSend: { $ne: true } }, { reviewedSend: { $exists: false } }],
//             }).populate("userId hostId propertyId messageId");

//             console.log(`Found ${payments.length} payments for review reminders`);

//             let sentCount = 0;

//             for (const payment of payments) {
//                 await this.sendReviewReminder(payment);
//                 sentCount++;
//             }

//             console.log(`Review reminders sent for ${sentCount} payments`);
//         } catch (error) {
//             console.error("Error in review reminder cron job:", error);
//         }
//     }

//     private async sendReviewReminder(payment: any): Promise<void> {
//         const session = await mongoose.startSession();

//         try {
//             await session.withTransaction(async () => {
//                 // Send 2 SEPARATE review messages - one for each user

//                 // Message 1: For GUEST to rate HOST
//                 const guestReviewMessage = await Message.create(
//                     [
//                         {
//                             conversationId: payment.conversationId,
//                             sender: payment.hostId._id,
//                             type: "review",
//                             text: ``,
//                             propertyId: payment.propertyId._id.toString(),
//                             expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//                         },
//                     ],
//                     { session }
//                 );

//                 // Message 2: For HOST to rate GUEST
//                 const hostReviewMessage = await Message.create(
//                     [
//                         {
//                             conversationId: payment.conversationId,
//                             sender: payment.userId._id,
//                             type: "review",
//                             text: ``,
//                             propertyId: payment.propertyId._id.toString(),
//                             expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//                         },
//                     ],
//                     { session }
//                 );

//                 // Update conversation with the last review message
//                 await Conversation.findByIdAndUpdate(
//                     payment.conversationId,
//                     {
//                         lastMessage: hostReviewMessage[0]._id, // Use the last message created
//                     },
//                     { session }
//                 );

//                 // Mark reviewedSend as true in payment
//                 await PaymentModel.findByIdAndUpdate(
//                     payment._id,
//                     {
//                         reviewedSend: true,
//                     },
//                     { session }
//                 );

//                 console.log(`2 review messages sent for payment ${payment._id}`);
//             });
//         } catch (error) {
//             console.error(`Error sending review reminder for payment ${payment._id}:`, error);
//         } finally {
//             await session.endSession();
//         }
//     }
// }

// export const reviewReminderCron = new ReviewReminderCron();
