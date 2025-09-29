"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = exports.generateVerificationToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateVerificationToken = (expiryHours = 24) => {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    return { token, expiry };
};
exports.generateVerificationToken = generateVerificationToken;
const generateOtp = (length = 6, expiryMinutes = 5) => {
    const otp = crypto_1.default
        .randomInt(0, 10 ** length)
        .toString()
        .padStart(length, "0");
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return { otp, expiry };
};
exports.generateOtp = generateOtp;
