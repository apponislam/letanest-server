"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// accountType enum
const accountTypes = ["email", "google", "facebook", "github", "apple"];
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().nonempty("Name is required").min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    email: zod_1.z
        .string()
        .nonempty("Email is required")
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Invalid email address",
    }),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be at most 100 characters").optional(), // make optional for OAuth users
    phone: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^\+?\d{7,15}$/.test(val), { message: "Invalid phone number" }),
    role: zod_1.z.enum(["user", "admin", "moderator", "super_admin"]).optional().default("user"),
    accountType: zod_1.z.enum(accountTypes).default("email"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .nonempty("Email is required")
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Invalid email address",
    }),
    password: zod_1.z.string().nonempty("Password is required").min(6, "Password must be at least 6 characters").max(100, "Password must be at most 100 characters"),
});
