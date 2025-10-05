// Roles constants
export const roles = {
    GUEST: "GUEST" as const,
    HOST: "HOST" as const,
    ADMIN: "ADMIN" as const,
};

export type Role = (typeof roles)[keyof typeof roles];

// IUser interface
export interface IUser {
    _id?: string;

    // Basic info
    name: string;
    email: string;
    password: string;
    phone?: string;
    profileImg?: string;

    // Role & status
    role: Role;
    isActive: boolean;
    lastLogin?: Date;

    // Email verification
    isEmailVerified?: boolean;
    verificationToken?: string;
    verificationTokenExpiry?: Date;

    // OTP / password reset
    resetPasswordOtp?: string;
    resetPasswordOtpExpiry?: Date;

    //Verification
    isVerifiedByAdmin?: boolean;
    verificationStatus?: string;

    //other profile details
    address?: {
        street: string;
        country: string;
        city: string;
        zip: string;
    };
    gender?: "Male" | "Female" | "Other";

    // Audit
    createdAt?: Date;
    updatedAt?: Date;
}
