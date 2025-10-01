"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const auth_interface_1 = require("./auth.interface");
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
