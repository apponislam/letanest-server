import { UserModel } from "./auth.model";
import { LoginInput, RegisterInput } from "./auth.validation";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { jwtHelper } from "../../../utils/jwtHelpers";
import config from "../../config";
import ApiError from "../../../errors/ApiError";
import { generateOtp, generateVerificationToken } from "../../../utils/tokenGenerator";
import { sendVerificationEmail } from "../../../shared/emailVerifyMail";
import { sendOtpEmail } from "../../../shared/sendOtpEmail";
import { Types } from "mongoose";

const registerUser = async (data: RegisterInput & { profileImg?: string }) => {
    // Check if email exists
    const existing = await UserModel.findOne({ email: data.email });
    if (existing) throw new ApiError(httpStatus.BAD_REQUEST, "Email already in use");

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, Number(config.bcrypt_salt_rounds));

    // Prepare user data
    const userData: any = {
        ...data,
        role: data.role || "GUEST",
        password: hashedPassword,
        isActive: true,
    };

    // Email verification
    const { token, expiry } = generateVerificationToken(24);
    userData.verificationToken = token;
    userData.verificationTokenExpiry = expiry;
    userData.isEmailVerified = false;

    // Create user
    const createdUser = await UserModel.create(userData);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${createdUser.verificationToken}&id=${createdUser._id}`;
    await sendVerificationEmail({
        to: createdUser.email,
        name: createdUser.name,
        verificationUrl,
    });

    // Generate JWT tokens
    const jwtPayload = {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        profileImg: createdUser.profileImg,
        role: createdUser.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = createdUser.toObject();

    return { user: userWithoutPassword, accessToken, refreshToken };
};

const resendVerificationEmailService = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    if (user.isEmailVerified) throw new ApiError(httpStatus.BAD_REQUEST, "Email already verified");

    const { token, expiry } = generateVerificationToken();
    user.verificationToken = token;
    user.verificationTokenExpiry = expiry;
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&id=${user._id}`;
    await sendVerificationEmail({ to: user.email, name: user.name, verificationUrl });

    return { email: user.email, sent: true };
};

const verifyEmailService = async (userId: string, token: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    if (user.isEmailVerified) throw new ApiError(httpStatus.BAD_REQUEST, "Email already verified");
    if (user.verificationToken !== token) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid token");
    if (!user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) throw new ApiError(httpStatus.BAD_REQUEST, "Token expired");

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return user;
};

const loginUser = async (data: LoginInput) => {
    const user = await UserModel.findOne({ email: data.email }).select("+password");
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");

    user.lastLogin = new Date();
    await user.save();

    const jwtPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImg: user.profileImg,
        role: user.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();

    return { user: userWithoutPassword, accessToken, refreshToken };
};

const getMeService = async (userId: string | Types.ObjectId) => {
    const _id = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const user = await UserModel.findById(_id).select("-password -resetPasswordOtp -resetPasswordOtpExpiry");
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    return user;
};

const refreshToken = async (token: string) => {
    if (!token) throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is required");

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
        _id: string;
        name: string;
        email: string;
        profileImg?: string;
        role: string;
    };

    const user = await UserModel.findById(decoded._id);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    const jwtPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImg: user.profileImg,
        role: user.role,
    };

    const newAccessToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();
    return { accessToken: newAccessToken, user: userWithoutPassword };
};

const requestPasswordResetOtp = async (email: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    const { otp, expiry } = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = expiry;
    await user.save();

    await sendOtpEmail({ to: user.email, name: user.name, otp });
    return { message: "OTP sent to email" };
};

const resendPasswordResetOtp = async (email: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    const { otp, expiry } = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = expiry;
    await user.save();

    await sendOtpEmail({ to: user.email, name: user.name, otp });
    return { message: "OTP resent to email" };
};

const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
    if (!user.resetPasswordOtpExpiry || user.resetPasswordOtpExpiry < new Date()) throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");

    user.password = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();

    return { message: "Password reset successful" };
};

const changePassword = async (userId: Types.ObjectId, currentPassword: string, newPassword: string) => {
    const user = await UserModel.findById(userId).select("+password");
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) throw new ApiError(httpStatus.BAD_REQUEST, "Current password is incorrect");

    user.password = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    await user.save();

    return { message: "Password changed successfully" };
};

export const authServices = {
    registerUser,
    resendVerificationEmailService,
    verifyEmailService,
    loginUser,
    getMeService,
    refreshToken,
    requestPasswordResetOtp,
    resendPasswordResetOtp,
    resetPasswordWithOtp,
    changePassword,
};
