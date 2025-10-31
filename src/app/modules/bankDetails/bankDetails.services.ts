import httpStatus from "http-status";
import { IBankDetails, ICreateBankDetails } from "./bankDetails.interface";
import { BankDetails } from "./bankDetails.model";
import ApiError from "../../../errors/ApiError";

const createBankDetails = async (payload: ICreateBankDetails & { userId: string }): Promise<IBankDetails> => {
    const existingBankDetails = await BankDetails.findOne({
        userId: payload.userId,
        isActive: true,
    });

    if (existingBankDetails) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Bank details already exist for this user");
    }

    const bankDetails = await BankDetails.create(payload);
    return bankDetails;
};

const getMyBankDetails = async (userId: string): Promise<IBankDetails | null> => {
    const bankDetails = await BankDetails.findOne({
        userId,
        isActive: true,
    });

    if (!bankDetails) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bank details not found");
    }

    return bankDetails;
};

const getBankDetailsByUserId = async (userId: string): Promise<IBankDetails | null> => {
    const bankDetails = await BankDetails.findOne({
        userId,
        isActive: true,
    });

    if (!bankDetails) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bank details not found for this user");
    }

    return bankDetails;
};

const updateMyBankDetails = async (userId: string, payload: Partial<ICreateBankDetails>): Promise<IBankDetails | null> => {
    const bankDetails = await BankDetails.findOneAndUpdate(
        {
            userId,
            isActive: true,
        },
        payload,
        { new: true }
    );

    if (!bankDetails) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bank details not found");
    }

    return bankDetails;
};

const deleteMyBankDetails = async (userId: string): Promise<void> => {
    const bankDetails = await BankDetails.findOneAndUpdate(
        {
            userId,
            isActive: true,
        },
        { isActive: false },
        { new: true }
    );

    if (!bankDetails) {
        throw new ApiError(httpStatus.NOT_FOUND, "Bank details not found");
    }
};

export const bankDetailsServices = {
    createBankDetails,
    getMyBankDetails,
    getBankDetailsByUserId,
    updateMyBankDetails,
    deleteMyBankDetails,
};
