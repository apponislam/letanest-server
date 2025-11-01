import { UserModel } from "../auth/auth.model";
import { UserSubscription } from "../subscribed/subscribed.model";

export interface CommissionResult {
    commissionRate: number;
    commissionAmount: number;
    hostAmount: number;
    usedFreeBooking: boolean;
}

export const calculateCommission = async (hostId: string, agreedFee: number): Promise<CommissionResult> => {
    const host = await UserModel.findById(hostId).populate("currentSubscription");
    if (!host) throw new Error("Host not found");
    let commissionRate = 10;
    let usedFreeBooking = false;

    if (host.freeTireData && (host.freeTireData.freeBookings || 0) > 0) {
        commissionRate = 0;
        usedFreeBooking = true;
        await UserModel.findByIdAndUpdate(hostId, { $inc: { "freeTireData.freeBookings": -1 } });
    } else if (host.currentSubscription) {
        const userSubscription = await UserSubscription.findById(host.currentSubscription).populate("subscription");

        if (userSubscription?.status === "active") {
            const subscription = userSubscription.subscription as any;
            if (subscription.bookingLimit > 0) {
                commissionRate = 0;
                usedFreeBooking = true;
                await UserSubscription.findByIdAndUpdate(host.currentSubscription, { $inc: { bookingLimit: -1 } });
            } else if (subscription.commission) {
                commissionRate = subscription.commission;
            }
        }
    }

    const commissionAmount = agreedFee * (commissionRate / 100);
    const hostAmount = agreedFee - commissionAmount;

    return { commissionRate, commissionAmount, hostAmount, usedFreeBooking };
};
