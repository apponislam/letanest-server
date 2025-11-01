import { Types } from "mongoose";

export interface IPrivacyPolicy {
    _id?: Types.ObjectId;
    content: string;
    effectiveDate: Date;
    isActive: boolean;
    createdBy?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
