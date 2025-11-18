import { Types } from "mongoose";

export interface IPeaceOfMindFee {
    _id?: Types.ObjectId;
    fee: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreatePeaceOfMindFee {
    fee: number;
}
