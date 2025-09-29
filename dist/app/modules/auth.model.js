"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    password: {
        type: String,
        required: function () {
            return this.accountType === "email";
        },
        validate: {
            validator: function (value) {
                if (this.accountType === "email") {
                    return !!value && value.length > 0;
                }
                return true;
            },
            message: "Password is required for email accounts",
        },
    },
    phone: { type: String },
    profileImg: { type: String },
    role: {
        type: String,
        enum: {
            values: ["user", "admin", "moderator"],
            message: "Role must be either user, admin, or moderator",
        },
        default: "user",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    accountType: {
        type: String,
        enum: {
            values: ["email", "google", "facebook", "github", "apple"],
            message: "Account type must be email, google, facebook, github, or apple",
        },
        default: "email",
    },
    isEmailVerified: {
        type: Boolean,
        default: function () {
            return this.accountType === "email" ? false : undefined;
        },
    },
    verificationToken: {
        type: String,
        default: function () {
            return this.accountType === "email" ? undefined : undefined;
        },
    },
    verificationTokenExpiry: {
        type: Date,
        default: function () {
            return this.accountType === "email" ? undefined : undefined;
        },
    },
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpiry: { type: Date },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: function (doc, ret) {
            if (ret.password)
                delete ret.password;
            if (ret.__v)
                delete ret.__v;
            return ret;
        },
    },
});
userSchema.pre("save", function (next) {
    const user = this;
    if (user.accountType !== "email") {
        user.isEmailVerified = undefined;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
    }
    else if (user.isEmailVerified === undefined) {
        user.isEmailVerified = false;
    }
    next();
});
// Remove password after save for safety
userSchema.post("save", function (doc, next) {
    doc.password = undefined;
    next();
});
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
