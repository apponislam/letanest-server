"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const auth_interface_1 = require("./auth.interface");
const freeTireDataSchema = new mongoose_1.Schema({
    commission: { type: Number, default: null },
    freeBookings: { type: Number, default: null },
    listingLimit: { type: Number, default: null },
    bookingFee: { type: Number, default: null },
    bookingLimit: { type: Number, default: null },
}, { _id: false });
const hostStripeAccountSchema = new mongoose_1.Schema({
    stripeAccountId: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: null },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: [true, "Name is required"] },
    email: { type: String, required: [true, "Email is required"], unique: true },
    password: { type: String, required: [true, "Password is required"] },
    phone: { type: String },
    profileImg: { type: String },
    role: {
        type: String,
        enum: Object.values(auth_interface_1.roles),
        default: auth_interface_1.roles.GUEST,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: undefined },
    verificationTokenExpiry: { type: Date, default: undefined },
    //Verification
    isVerifiedByAdmin: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ["pending", "approved", "rejected", "under_review"], default: null },
    //other profile details
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        default: null,
    },
    address: {
        street: { type: String, default: null },
        country: { type: String, default: null },
        city: { type: String, default: null },
        zip: { type: String, default: null },
    },
    subscriptions: {
        type: [
            {
                subscription: { type: mongoose_1.Schema.Types.ObjectId, ref: "UserSubscription" },
            },
        ],
        default: [],
    },
    currentSubscription: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "UserSubscription",
        default: null,
    },
    freeTireUsed: { type: Boolean, default: false },
    freeTireExpiry: { type: Date, default: null },
    freeTireSub: { type: mongoose_1.Schema.Types.ObjectId, ref: "Subscription", default: null },
    freeTireData: { type: freeTireDataSchema, default: {} },
    // stripe
    stripeCustomerId: {
        type: String,
        unique: true,
        sparse: true,
    },
    hostStripeAccount: {
        type: hostStripeAccountSchema,
        default: null,
    },
    isBot: { type: Boolean },
    // OTP / password reset
    resetPasswordOtp: { type: String, default: undefined },
    resetPasswordOtpExpiry: { type: Date, default: undefined },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: (_doc, ret) => {
            if (ret.password)
                delete ret.password;
            return ret;
        },
    },
});
// Remove password after save for safety
userSchema.post("save", function (doc, next) {
    doc.password = undefined;
    next();
});
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
