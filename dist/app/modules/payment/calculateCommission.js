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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCommission = void 0;
const auth_model_1 = require("../auth/auth.model");
const subscribed_model_1 = require("../subscribed/subscribed.model");
const calculateCommission = (hostId, agreedFee) => __awaiter(void 0, void 0, void 0, function* () {
    const host = yield auth_model_1.UserModel.findById(hostId).populate("currentSubscription");
    if (!host)
        throw new Error("Host not found");
    let commissionRate = 10;
    let usedFreeBooking = false;
    if (host.freeTireData && (host.freeTireData.freeBookings || 0) > 0) {
        commissionRate = 0;
        usedFreeBooking = true;
        yield auth_model_1.UserModel.findByIdAndUpdate(hostId, { $inc: { "freeTireData.freeBookings": -1 } });
    }
    else if (host.currentSubscription) {
        const userSubscription = yield subscribed_model_1.UserSubscription.findById(host.currentSubscription).populate("subscription");
        if ((userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.status) === "active") {
            const subscription = userSubscription.subscription;
            if (subscription.bookingLimit > 0) {
                commissionRate = 0;
                usedFreeBooking = true;
                yield subscribed_model_1.UserSubscription.findByIdAndUpdate(host.currentSubscription, { $inc: { bookingLimit: -1 } });
            }
            else if (subscription.commission) {
                commissionRate = subscription.commission;
            }
        }
    }
    const commissionAmount = agreedFee * (commissionRate / 100);
    const hostAmount = agreedFee - commissionAmount;
    return { commissionRate, commissionAmount, hostAmount, usedFreeBooking };
});
exports.calculateCommission = calculateCommission;
