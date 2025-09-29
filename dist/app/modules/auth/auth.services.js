"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const mongoose_1 = __importStar(require("mongoose"));
const id_generator_1 = require("../../../utils/id-generator");
const profile_model_1 = require("../profile/profile.model");
const realTimeLocation_model_1 = require("../realTimeLocation/realTimeLocation.model");
const registerUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Check if email exists
        const existing = yield auth_model_1.UserModel.findOne({ email: data.email }).session(session);
        if (existing) {
            // await session.abortTransaction();
            // session.endSession();
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Email already in use");
        }
        // Hash password if provided
        let hashedPassword = undefined;
        if (data.password) {
            hashedPassword = yield bcrypt_1.default.hash(data.password, Number(config_1.default.bcrypt_salt_rounds));
        }
        // Generate unique serialId
        const serialId = yield (0, id_generator_1.generateRandomId)(auth_model_1.UserModel, "BDU");
        // Prepare user data
        const userData = Object.assign(Object.assign({}, data), { serialId, role: data.role || "user", password: hashedPassword });
        // Generate verification for email accounts
        if (data.accountType === "email") {
            const { token, expiry } = (0, tokenGenerator_1.generateVerificationToken)(24);
            userData.verificationToken = token;
            userData.verificationTokenExpiry = expiry;
            userData.isEmailVerified = false;
        }
        // Create temporary ObjectIds for references
        const tempProfileId = new mongoose_1.default.Types.ObjectId();
        const tempLocationId = new mongoose_1.default.Types.ObjectId();
        // Add temporary references to user data
        userData.profile = tempProfileId;
        userData.realtimeLocation = tempLocationId;
        // Create user with session
        const users = yield auth_model_1.UserModel.create([userData], { session });
        const createdUser = users[0];
        // Create profile with actual user reference
        const profileData = {
            _id: tempProfileId,
            user: createdUser._id,
            serialId: createdUser.serialId,
        };
        // Create realtime location with actual user reference
        const locationData = {
            _id: tempLocationId,
            user: createdUser._id,
            serialId: createdUser.serialId,
            latitude: 0,
            longitude: 0,
            hideLocation: false,
        };
        // Create both documents in parallel
        yield Promise.all([profile_model_1.ProfileModel.create([profileData], { session }), realTimeLocation_model_1.RealtimeLocationModel.create([locationData], { session })]);
        // Commit the transaction
        yield session.commitTransaction();
        session.endSession();
        // Send verification email if needed
        if (createdUser.accountType === "email") {
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${createdUser.verificationToken}&id=${createdUser._id}`;
            yield (0, emailVerifyMail_1.sendVerificationEmail)({
                to: createdUser.email,
                name: createdUser.name,
                verificationUrl,
            });
        }
        // Populate profile and realtimeLocation before returning
        const populatedUser = yield auth_model_1.UserModel.findById(createdUser._id).populate("profile").populate("realtimeLocation").exec();
        if (!populatedUser)
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "User not found after creation");
        // Generate JWT tokens
        const jwtPayload = {
            _id: populatedUser._id,
            name: populatedUser.name,
            email: populatedUser.email,
            profileImg: populatedUser.profileImg,
            role: populatedUser.role,
            serialId: populatedUser.serialId,
        };
        const accessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
        const refreshToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
        // Remove password
        const _a = populatedUser.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }
    catch (error) {
        // Abort transaction on error
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const resendVerificationEmailService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId);
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    if (user.isEmailVerified)
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Email already verified");
    // Generate new token
    const { token, expiry } = (0, tokenGenerator_1.generateVerificationToken)();
    user.verificationToken = token;
    user.verificationTokenExpiry = expiry;
    yield user.save();
    // Build verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&id=${user._id}`;
    // Send email
    yield (0, emailVerifyMail_1.sendVerificationEmail)({
        to: user.email,
        name: user.name,
        verificationUrl,
    });
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
    // Mark email as verified and remove token
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    yield user.save();
    return user;
});
const loginUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findOne({ email: data.email }).select("+password").populate("profile").populate("realtimeLocation").exec();
    if (!user)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid credentials");
    const isMatch = yield bcrypt_1.default.compare(data.password, user.password);
    if (!isMatch)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid credentials");
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
    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
});
// --- GOOGLE LOGIN ---
// const handleGoogleLogin = async (profile: any) => {
//     const email = profile.emails?.[0]?.value;
//     if (!email) throw new ApiError(httpStatus.BAD_REQUEST, "Google profile does not contain email");
//     let user = await UserModel.findOne({ email });
//     if (!user) {
//         const serialId = await generateRandomId(UserModel, "BDU");
//         user = await UserModel.create({
//             serialId,
//             name: profile.displayName,
//             email,
//             profileImg: profile.photos?.[0]?.value,
//             role: "user",
//             isActive: true,
//             lastLogin: new Date(),
//             accountType: "google",
//         });
//     } else {
//         user.lastLogin = new Date();
//         await user.save();
//     }
//     const jwtPayload = {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         profileImg: user.profileImg,
//         role: user.role,
//         serialId: user.serialId,
//     };
//     const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret!, config.jwt_access_expire!);
//     const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret!, config.jwt_refresh_expire!);
//     return { user, accessToken, refreshToken };
// };
const handleGoogleLogin = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            yield session.abortTransaction();
            session.endSession();
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Google profile does not contain email");
        }
        // Check if user already exists
        let user = yield auth_model_1.UserModel.findOne({ email }).session(session);
        if (!user) {
            // Generate unique serialId
            const serialId = yield (0, id_generator_1.generateRandomId)(auth_model_1.UserModel, "BDU");
            // Create temporary ObjectIds for references
            const tempProfileId = new mongoose_1.default.Types.ObjectId();
            const tempLocationId = new mongoose_1.default.Types.ObjectId();
            // Prepare user data with temporary references
            const userData = {
                serialId,
                name: profile.displayName,
                email,
                profileImg: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
                role: "user",
                isActive: true,
                lastLogin: new Date(),
                accountType: "google",
                profile: tempProfileId,
                realtimeLocation: tempLocationId,
            };
            // Create user with session
            const users = yield auth_model_1.UserModel.create([userData], { session });
            user = users[0];
            // Create Profile & RealtimeLocation
            const profileData = {
                _id: tempProfileId,
                user: user._id,
                serialId: user.serialId,
                profileImg: (_f = (_e = profile.photos) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.value,
            };
            const locationData = {
                _id: tempLocationId,
                user: user._id,
                serialId: user.serialId,
                latitude: 0,
                longitude: 0,
                hideLocation: true,
            };
            yield Promise.all([profile_model_1.ProfileModel.create([profileData], { session }), realTimeLocation_model_1.RealtimeLocationModel.create([locationData], { session })]);
        }
        else {
            // Existing user, just update last login
            user.lastLogin = new Date();
            yield user.save({ session });
        }
        // Commit transaction
        yield session.commitTransaction();
        session.endSession();
        // Populate profile and realtimeLocation
        const populatedUser = yield auth_model_1.UserModel.findById(user._id).populate("profile").populate("realtimeLocation").exec();
        if (!populatedUser)
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "User not found after login");
        // Generate JWT tokens
        const jwtPayload = {
            _id: populatedUser._id,
            name: populatedUser.name,
            email: populatedUser.email,
            profileImg: populatedUser.profileImg,
            role: populatedUser.role,
            serialId: populatedUser.serialId,
        };
        const accessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
        const refreshToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
        // Remove password if exists
        const _g = populatedUser.toObject(), { password } = _g, userWithoutPassword = __rest(_g, ["password"]);
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
// // --- FACEBOOK LOGIN ---
// const handleFacebookLogin = async (profile: any) => {
//     const email = profile.emails?.[0]?.value;
//     if (!email) {
//         return {
//             requiresEmail: true,
//             profile: {
//                 name: profile.displayName,
//                 profileImg: profile.photos?.[0]?.value,
//             },
//         };
//     }
//     let user = await UserModel.findOne({ email });
//     if (!user) {
//         const serialId = await generateRandomId(UserModel, "BDU");
//         user = await UserModel.create({
//             serialId,
//             name: profile.displayName,
//             email,
//             password: undefined,
//             profileImg: profile.photos?.[0]?.value,
//             role: "user",
//             isActive: true,
//             accountType: "facebook",
//             lastLogin: new Date(),
//         });
//     } else {
//         user.lastLogin = new Date();
//         await user.save();
//     }
//     const jwtPayload = {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         profileImg: user.profileImg,
//         role: user.role,
//         serialId: user.serialId,
//     };
//     const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret!, config.jwt_access_expire!);
//     const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret!, config.jwt_refresh_expire!);
//     return { user, accessToken, refreshToken };
// };
// // --- COMPLETE FACEBOOK LOGIN ---
// const completeFacebookLoginWithEmail = async (profile: any, email: string) => {
//     let user = await UserModel.findOne({ email });
//     if (!user) {
//         const serialId = await generateRandomId(UserModel, "BDU");
//         user = await UserModel.create({
//             serialId,
//             name: profile.name,
//             email,
//             password: undefined,
//             profileImg: profile.profileImg,
//             role: "user",
//             isActive: true,
//             accountType: "facebook",
//             lastLogin: new Date(),
//         });
//     } else {
//         user.lastLogin = new Date();
//         await user.save();
//     }
//     const jwtPayload = {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         profileImg: user.profileImg,
//         role: user.role,
//         serialId: user.serialId,
//     };
//     const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret!, config.jwt_access_expire!);
//     const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret!, config.jwt_refresh_expire!);
//     return { user, accessToken, refreshToken };
// };
// --- FACEBOOK LOGIN ---
const handleFacebookLogin = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
    if (!email) {
        return {
            requiresEmail: true,
            profile: {
                name: profile.displayName,
                profileImg: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
            },
        };
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        let user = yield auth_model_1.UserModel.findOne({ email }).session(session);
        if (!user) {
            // Generate serialId and temporary ObjectIds
            const serialId = yield (0, id_generator_1.generateRandomId)(auth_model_1.UserModel, "BDU");
            const tempProfileId = new mongoose_1.default.Types.ObjectId();
            const tempLocationId = new mongoose_1.default.Types.ObjectId();
            const userData = {
                serialId,
                name: profile.displayName,
                email,
                password: undefined,
                profileImg: (_f = (_e = profile.photos) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.value,
                role: "user",
                isActive: true,
                accountType: "facebook",
                lastLogin: new Date(),
                profile: tempProfileId,
                realtimeLocation: tempLocationId,
            };
            const users = yield auth_model_1.UserModel.create([userData], { session });
            user = users[0];
            // Create profile & realtime location
            const profileData = {
                _id: tempProfileId,
                user: user._id,
                serialId,
                profileImg: (_h = (_g = profile.photos) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.value,
            };
            const locationData = {
                _id: tempLocationId,
                user: user._id,
                serialId,
                latitude: 0,
                longitude: 0,
                hideLocation: true,
            };
            yield Promise.all([profile_model_1.ProfileModel.create([profileData], { session }), realTimeLocation_model_1.RealtimeLocationModel.create([locationData], { session })]);
        }
        else {
            user.lastLogin = new Date();
            yield user.save({ session });
        }
        yield session.commitTransaction();
        session.endSession();
        // Populate
        const populatedUser = yield auth_model_1.UserModel.findById(user._id).populate("profile").populate("realtimeLocation").exec();
        if (!populatedUser)
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "User not found");
        const jwtPayload = {
            _id: populatedUser._id,
            name: populatedUser.name,
            email: populatedUser.email,
            profileImg: populatedUser.profileImg,
            role: populatedUser.role,
            serialId: populatedUser.serialId,
        };
        const accessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
        const refreshToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
        const _j = populatedUser.toObject(), { password } = _j, userWithoutPassword = __rest(_j, ["password"]);
        return { user: userWithoutPassword, accessToken, refreshToken };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
// --- COMPLETE FACEBOOK LOGIN WITH EMAIL ---
const completeFacebookLoginWithEmail = (profile, email) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        let user = yield auth_model_1.UserModel.findOne({ email }).session(session);
        if (!user) {
            // Generate serialId and temporary ObjectIds
            const serialId = yield (0, id_generator_1.generateRandomId)(auth_model_1.UserModel, "BDU");
            const tempProfileId = new mongoose_1.default.Types.ObjectId();
            const tempLocationId = new mongoose_1.default.Types.ObjectId();
            const userData = {
                serialId,
                name: profile.name,
                email,
                password: undefined,
                profileImg: profile.profileImg,
                role: "user",
                isActive: true,
                accountType: "facebook",
                lastLogin: new Date(),
                profile: tempProfileId,
                realtimeLocation: tempLocationId,
            };
            const users = yield auth_model_1.UserModel.create([userData], { session });
            user = users[0];
            const profileData = {
                _id: tempProfileId,
                user: user._id,
                serialId,
                profileImg: profile.profileImg,
            };
            const locationData = {
                _id: tempLocationId,
                user: user._id,
                serialId,
                latitude: 0,
                longitude: 0,
                hideLocation: true,
            };
            yield Promise.all([profile_model_1.ProfileModel.create([profileData], { session }), realTimeLocation_model_1.RealtimeLocationModel.create([locationData], { session })]);
        }
        else {
            user.lastLogin = new Date();
            yield user.save({ session });
        }
        yield session.commitTransaction();
        session.endSession();
        // Populate
        const populatedUser = yield auth_model_1.UserModel.findById(user._id).populate("profile").populate("realtimeLocation").exec();
        if (!populatedUser)
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "User not found");
        const jwtPayload = {
            _id: populatedUser._id,
            name: populatedUser.name,
            email: populatedUser.email,
            profileImg: populatedUser.profileImg,
            role: populatedUser.role,
            serialId: populatedUser.serialId,
        };
        const accessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
        const refreshToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
        const _a = populatedUser.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
        return { user: userWithoutPassword, accessToken, refreshToken };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const getMeService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const _id = typeof userId === "string" ? new mongoose_1.Types.ObjectId(userId) : userId;
    const user = yield auth_model_1.UserModel.findById(_id).select("-password -resetPasswordOtp -resetPasswordOtpExpiry");
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    return user;
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Refresh token is required");
    }
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = yield auth_model_1.UserModel.findById(decoded._id);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImg: user.profileImg,
        role: user.role,
    };
    const newAccessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
    const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return {
        accessToken: newAccessToken,
        user: userWithoutPassword,
    };
});
const requestPasswordResetOtp = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findOne({ email });
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    const { otp, expiry } = (0, tokenGenerator_1.generateOtp)();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = expiry;
    yield user.save();
    yield (0, sendOtpEmail_1.sendOtpEmail)({ to: user.email, name: user.name, otp });
    return { message: "OTP sent to email" };
});
const resendPasswordResetOtp = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findOne({ email });
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    const { otp, expiry } = (0, tokenGenerator_1.generateOtp)();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = expiry;
    yield user.save();
    yield (0, sendOtpEmail_1.sendOtpEmail)({ to: user.email, name: user.name, otp });
    return { message: "OTP resent to email" };
});
const resetPasswordWithOtp = (email, otp, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findOne({ email });
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP");
    }
    if (!user.resetPasswordOtpExpiry || user.resetPasswordOtpExpiry < new Date()) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "OTP expired");
    }
    user.password = yield bcrypt_1.default.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    yield user.save();
    return { message: "Password reset successful" };
});
const changePassword = (userId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.UserModel.findById(userId).select("+password");
    if (!user)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    // Validate current password
    const isPasswordCorrect = yield bcrypt_1.default.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Current password is incorrect");
    }
    // Hash and save new password
    user.password = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    yield user.save();
    return { message: "Password changed successfully" };
});
exports.authServices = {
    registerUser,
    resendVerificationEmailService,
    verifyEmailService,
    loginUser,
    handleGoogleLogin,
    handleFacebookLogin,
    completeFacebookLoginWithEmail,
    getMeService,
    refreshToken,
    requestPasswordResetOtp,
    resendPasswordResetOtp,
    resetPasswordWithOtp,
    changePassword,
};
