import { Types } from "mongoose";

export interface IBankDetails {
    _id?: string;
    userId: Types.ObjectId;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    accountType: "personal" | "business";
    country: string;
    isVerified: boolean;
    verifiedAt?: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateBankDetails {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    accountType: "personal" | "business";
    country: string;
}
