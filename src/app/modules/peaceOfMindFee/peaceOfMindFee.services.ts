import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ICreatePeaceOfMindFee, IPeaceOfMindFee } from "./peaceOfMindFee.interface";
import { PeaceOfMindFee } from "./peaceOfMindFee.model";

const createOrUpdateFee = async (payload: ICreatePeaceOfMindFee): Promise<IPeaceOfMindFee> => {
    await PeaceOfMindFee.deleteMany();
    const fee = await PeaceOfMindFee.create(payload);
    return fee;
};

const getFee = async (): Promise<IPeaceOfMindFee> => {
    const fee = await PeaceOfMindFee.findOne();
    if (!fee) {
        throw new ApiError(httpStatus.NOT_FOUND, "Peace of mind fee not found");
    }
    return fee;
};

export const peaceOfMindFeeServices = {
    createOrUpdateFee,
    getFee,
};
