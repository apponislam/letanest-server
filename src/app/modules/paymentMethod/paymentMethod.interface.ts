import { Types } from "mongoose";

export interface IPaymentMethod {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    stripeCustomerId: string;
    paymentMethodId: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    isDefault: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPaymentMethodCreate {
    userId: Types.ObjectId;
    stripeCustomerId: string;
    paymentMethodId: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    isDefault?: boolean;
}
