import { z } from "zod";

// Roles constants
export const roles = {
    GUEST: "GUEST" as const,
    HOST: "HOST" as const,
    ADMIN: "ADMIN" as const,
};

export type Role = (typeof roles)[keyof typeof roles];

// Register schema
export const registerSchema = z.object({
    name: z.string().nonempty("Name is required").min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    email: z
        .string()
        .nonempty("Email is required")
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: "Invalid email address" }),
    password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be at most 100 characters"),
    phone: z
        .string()
        .optional()
        .refine((val) => !val || /^\+?\d{7,15}$/.test(val), { message: "Invalid phone number" }),
    profileImg: z.string().optional(),
    role: z.enum(["GUEST", "HOST", "ADMIN"]).optional().default("GUEST"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
    email: z
        .string()
        .nonempty("Email is required")
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: "Invalid email address" }),
    password: z.string().nonempty("Password is required").min(6, "Password must be at least 6 characters").max(100, "Password must be at most 100 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
