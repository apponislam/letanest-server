import { model, Schema } from "mongoose";
import { IUser, roles } from "./auth.interface";

const freeTireDataSchema = new Schema(
    {
        commission: { type: Number, default: null },
        freeBookings: { type: Number, default: null },
        listingLimit: { type: Number, default: null },
        bookingFee: { type: Number, default: null },
        bookingLimit: { type: Number, default: null },
    },
    { _id: false }
);

const hostStripeAccountSchema = new Schema(
    {
        stripeAccountId: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
        verifiedAt: { type: Date, default: null },
    },
    { _id: false }
);

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: [true, "Name is required"] },
        email: { type: String, required: [true, "Email is required"], unique: true },
        password: { type: String, required: [true, "Password is required"] },
        phone: { type: String },
        profileImg: { type: String },
        role: {
            type: String,
            enum: Object.values(roles),
            default: roles.GUEST,
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
                    subscription: { type: Schema.Types.ObjectId, ref: "UserSubscription" },
                },
            ],
            default: [],
        },

        freeTireUsed: { type: Boolean, default: false },
        freeTireExpiry: { type: Date, default: null },
        freeTireSub: { type: Schema.Types.ObjectId, ref: "Subscription", default: null },
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

        // OTP / password reset
        resetPasswordOtp: { type: String, default: undefined },
        resetPasswordOtpExpiry: { type: Date, default: undefined },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: (_doc, ret) => {
                if (ret.password) delete (ret as any).password;
                return ret;
            },
        },
    }
);

// Remove password after save for safety
userSchema.post("save", function (doc, next) {
    doc.password = undefined as any;
    next();
});

export const UserModel = model<IUser>("User", userSchema);
