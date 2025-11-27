// import { CronJob } from "cron";
// import mongoose from "mongoose";
// import { PaymentModel } from "../payment/payment.model";
// import { Conversation, Message } from "../messages/messages.model";

// class ReviewReminderCron {
//     private job: CronJob;

//     constructor() {
//         this.job = new CronJob("*/15 * * * *", this.sendReviewReminders.bind(this));
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

//             console.log(`Checking ${payments.length} payments for review reminders`);

//             let sentCount = 0;

//             for (const payment of payments) {
//                 const shouldSend = await this.shouldSendReviewReminder(payment);
//                 if (shouldSend) {
//                     await this.sendReviewReminder(payment);
//                     sentCount++;
//                 }
//             }

//             console.log(`Review reminders sent for ${sentCount} payments`);
//         } catch (error) {
//             console.error("Error in review reminder cron job:", error);
//         }
//     }

//     private async shouldSendReviewReminder(payment: any): Promise<boolean> {
//         try {
//             // Get checkOutDate from message
//             const message = await Message.findById(payment.messageId);
//             if (!message || !message.checkOutDate) {
//                 return false;
//             }

//             // Calculate if 7 days have passed from checkOutDate
//             const checkOutDate = new Date(message.checkOutDate);
//             const sevenDaysAfter = new Date(checkOutDate);
//             sevenDaysAfter.setDate(checkOutDate.getDate() + 7);

//             const today = new Date();
//             return today >= sevenDaysAfter;
//         } catch (error) {
//             console.error(`Error checking shouldSend for payment ${payment._id}:`, error);
//             return false;
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

import { CronJob } from "cron";
import mongoose from "mongoose";
import { PaymentModel } from "../payment/payment.model";
import { Conversation, Message } from "../messages/messages.model";

class ReviewReminderCron {
    private job: CronJob;

    constructor() {
        // this.job = new CronJob("*/15 * * * *", this.sendReviewReminders.bind(this));
        this.job = new CronJob("*/10 * * * * *", this.sendReviewReminders.bind(this));
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
            console.log("Running review reminder cron job...");

            // Get all completed payments where reviewedSend is not true
            const payments = await PaymentModel.find({
                status: "completed",
                $or: [{ reviewedSend: { $ne: true } }, { reviewedSend: { $exists: false } }],
            }).populate("userId hostId propertyId messageId");

            console.log(`Found ${payments.length} payments for review reminders`);

            let sentCount = 0;

            for (const payment of payments) {
                await this.sendReviewReminder(payment);
                sentCount++;
            }

            console.log(`Review reminders sent for ${sentCount} payments`);
        } catch (error) {
            console.error("Error in review reminder cron job:", error);
        }
    }

    private async sendReviewReminder(payment: any): Promise<void> {
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                // Send 2 SEPARATE review messages - one for each user

                // Message 1: For GUEST to rate HOST
                const guestReviewMessage = await Message.create(
                    [
                        {
                            conversationId: payment.conversationId,
                            sender: payment.hostId._id,
                            type: "review",
                            text: ``,
                            propertyId: payment.propertyId._id.toString(),
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        },
                    ],
                    { session }
                );

                // Update conversation with the last review message
                await Conversation.findByIdAndUpdate(
                    payment.conversationId,
                    {
                        lastMessage: hostReviewMessage[0]._id, // Use the last message created
                    },
                    { session }
                );

                // Mark reviewedSend as true in payment
                await PaymentModel.findByIdAndUpdate(
                    payment._id,
                    {
                        reviewedSend: true,
                    },
                    { session }
                );

                console.log(`2 review messages sent for payment ${payment._id}`);
            });
        } catch (error) {
            console.error(`Error sending review reminder for payment ${payment._id}:`, error);
        } finally {
            await session.endSession();
        }
    }
}

export const reviewReminderCron = new ReviewReminderCron();
