// import { Types } from "mongoose";

// export interface IBankDetails {
//     _id?: string;
//     userId: Types.ObjectId;
//     accountHolderName: string;
//     accountNumber: string;
//     bankName: string;
//     accountType: "personal" | "business";
//     country: string;
//     isVerified: boolean;
//     verifiedAt?: Date;
//     isActive: boolean;
//     createdAt?: Date;
//     updatedAt?: Date;
// }

// export interface ICreateBankDetails {
//     accountHolderName: string;
//     accountNumber: string;
//     bankName: string;
//     accountType: "personal" | "business";
//     country: string;
// }

import { Types } from "mongoose";

export interface IBankDetails {
    _id?: string;
    userId: Types.ObjectId;
    accountHolderName: string;
    accountNumber: string;
    sortCode: string; // ADDED: 6-digit sort code for UK transfers
    bankName: string;
    accountType: "personal" | "business";
    country: string;
    iban?: string; // ADDED: For international transfers
    bicSwift?: string; // ADDED: For international transfers
    isVerified: boolean;
    verifiedAt?: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateBankDetails {
    accountHolderName: string;
    accountNumber: string;
    sortCode: string; // ADDED
    bankName: string;
    accountType: "personal" | "business";
    country: string;
    iban?: string; // ADDED
    bicSwift?: string; // ADDED
}
