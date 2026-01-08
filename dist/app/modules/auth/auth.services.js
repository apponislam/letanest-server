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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authServices = void 0;
const auth_model_1 = require("./auth.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_1 = __importDefault(require("http-status"));
const jwtHelpers_1 = require("../../../utils/jwtHelpers");
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const tokenGenerator_1 = require("../../../utils/tokenGenerator");
const emailVerifyMail_1 = require("../../../shared/emailVerifyMail");
const sendOtpEmail_1 = require("../../../shared/sendOtpEmail");
const mongoose_1 = require("mongoose");
const subscription_model_1 = require("../subscription/subscription.model");
const users_services_1 = require("../users/users.services");
const registerUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if email exists
    const existing = yield auth_model_1.UserModel.findOne({ email: data.email });
    if (existing)
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Email already in use");
    // Hash password
    const hashedPassword = yield bcrypt_1.default.hash(data.password, Number(config_1.default.bcrypt_salt_rounds));
    // Prepare user data
    const userData = Object.assign(Object.assign({}, data), { role: data.role || "GUEST", password: hashedPassword, isActive: true });
    // Email verification
    const { token, expiry } = (0, tokenGenerator_1.generateVerificationToken)(24);
    userData.verificationToken = token;
    userData.verificationTokenExpiry = expiry;
    userData.isEmailVerified = false;
    // Create user
    const createdUser = yield auth_model_1.UserModel.create(userData);
    // Send verification email
    // Generate JWT tokens
    const jwtPayload = {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        profileImg: createdUser.profileImg,
        role: createdUser.role,
    };
    const accessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
    const refreshToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
    const _a = createdUser.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    const subscription = yield subscription_model_1.Subscription.findOne({
        type: createdUser.role,
        isActive: true,
        isDeleted: false,
        paymentLink: { $regex: "^free-tier" },
    })
        .select("_id")
        .lean();
    if (subscription === null || subscription === void 0 ? void 0 : subscription._id) {
        const userId = new mongoose_1.Types.ObjectId(createdUser._id);
        users_services_1.userServices.activateFreeTierService(userId, subscription._id);
    }
    setTimeout(() => {
        const verificationUrl = `${config_1.default.client_url}/verify-email?token=${token}&id=${createdUser._id}`;
        (0, emailVerifyMail_1.sendVerificationEmail)({
            to: createdUser.email,
            name: createdUser.name,
            verificationUrl,
        }).catch(console.error);
    }, 0);
    return { user: userWithoutPassword, accessToken, refreshToken };
});
const resendVerificationEmailService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    if (user.isEmailVerified)
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Email already verified");
    const { token, expiry } = (0, tokenGenerator_1.generateVerificationToken)();
    user.verificationToken = token;
    user.verificationTokenExpiry = expiry;
    yield user.save();
    setTimeout(() => {
        const verificationUrl = `${config_1.default.client_url}/verify-email?token=${token}&id=${user._id}`;
        (0, emailVerifyMail_1.sendVerificationEmail)({ to: user.email, name: user.name, verificationUrl }).catch(console.error);
    }, 0);
    return { email: user.email, sent: true };
});
const verifyEmailService = (userId, token) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    if (user.isEmailVerified)
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Email already verified");
    if (user.verificationToken !== token)
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid token");
    if (!user.verificationTokenExpiry || user.verificationTokenExpiry < new Date())
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Token expired");
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    yield user.save();
    return user;
});
const loginUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findOne({ email: data.email }).select("+password");
    if (!user)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Incorrect email or password. Please try again.");
    if (!user.isActive) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Your account has been deactivated. Please contact support.");
    }
    const isMatch = yield bcrypt_1.default.compare(data.password, user.password);
    if (!isMatch)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Incorrect email or password. Please try again.");
    user.lastLogin = new Date();
    yield user.save();
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImg: user.profileImg,
        role: user.role,
    };
    const accessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
    const refreshToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
    const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return { user: userWithoutPassword, accessToken, refreshToken };
});
const getMeService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const _id = typeof userId === "string" ? new mongoose_1.Types.ObjectId(userId) : userId;
    const user = yield auth_model_1.UserModel.findById(_id).select("-password -resetPasswordOtp -resetPasswordOtpExpiry");
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    return user;
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Refresh token is required");
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_refresh_secret);
    const user = yield auth_model_1.UserModel.findById(decoded._id);
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImg: user.profileImg,
        role: user.role,
    };
    const newAccessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
    const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return { accessToken: newAccessToken, user: userWithoutPassword };
});
const requestPasswordResetOtp = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findOne({ email });
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "We could not find an account with this email");
    const { otp, expiry } = (0, tokenGenerator_1.generateOtp)();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = expiry;
    yield user.save();
    process.nextTick(() => {
        (0, sendOtpEmail_1.sendOtpEmail)({ to: user.email, name: user.name, otp }).catch(console.error);
    });
    return { message: "An OTP has been sent to your email" };
});
const verifyOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findOne({ email });
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "We could not find an account with this email");
    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "The OTP you entered is invalid");
    }
    if (!user.resetPasswordOtpExpiry || user.resetPasswordOtpExpiry < new Date()) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "The OTP has expired, please request a new one");
    }
    const resetToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, config_1.default.jwt_password_reset_secret, { expiresIn: "10m" });
    return { message: "OTP verified successfully", resetToken };
});
const resendPasswordResetOtp = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findOne({ email });
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "We could not find an account with this email");
    const { otp, expiry } = (0, tokenGenerator_1.generateOtp)();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = expiry;
    yield user.save();
    process.nextTick(() => {
        (0, sendOtpEmail_1.sendOtpEmail)({ to: user.email, name: user.name, otp }).catch(console.error);
    });
    return { message: "A new OTP has been sent to your email" };
});
const resetPasswordWithToken = (resetToken, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(resetToken, config_1.default.jwt_password_reset_secret);
    }
    catch (err) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid or expired password reset token");
    }
    const user = yield auth_model_1.UserModel.findById(payload.userId);
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    // Update password
    user.password = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    yield user.save();
    return { message: "Password reset successful" };
});
const changePassword = (userId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId).select("+password");
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    const isPasswordCorrect = yield bcrypt_1.default.compare(currentPassword, user.password);
    if (!isPasswordCorrect)
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Current password is incorrect");
    user.password = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    yield user.save();
    return { message: "Password changed successfully" };
});
exports.authServices = {
    registerUser,
    resendVerificationEmailService,
    verifyEmailService,
    loginUser,
    getMeService,
    refreshToken,
    requestPasswordResetOtp,
    verifyOtp,
    resendPasswordResetOtp,
    resetPasswordWithToken,
    changePassword,
};
