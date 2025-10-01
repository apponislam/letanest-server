"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = exports.roles = void 0;
const zod_1 = require("zod");
// Roles constants
exports.roles = {
    GUEST: "GUEST",
    HOST: "HOST",
    ADMIN: "ADMIN",
};
// Register schema
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().nonempty("Name is required").min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    email: zod_1.z
        .string()
        .nonempty("Email is required")
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: "Invalid email address" }),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be at most 100 characters"),
    phone: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^\+?\d{7,15}$/.test(val), { message: "Invalid phone number" }),
    profileImg: zod_1.z.string().optional(),
    role: zod_1.z.enum(["GUEST", "HOST", "ADMIN"]).optional().default("GUEST"),
});
// Login schema
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .nonempty("Email is required")
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: "Invalid email address" }),
    password: zod_1.z.string().nonempty("Password is required").min(6, "Password must be at least 6 characters").max(100, "Password must be at most 100 characters"),
});
