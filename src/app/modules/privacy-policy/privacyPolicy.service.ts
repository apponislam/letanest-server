import httpStatus from "http-status";
import { IPrivacyPolicy } from "./privacyPolicy.interface";
import { PrivacyPolicy } from "./privacyPolicy.model";
import ApiError from "../../../errors/ApiError";

const createOrUpdatePrivacyPolicy = async (payload: Partial<IPrivacyPolicy>): Promise<IPrivacyPolicy> => {
    let privacyPolicy = await PrivacyPolicy.findOne();

    if (privacyPolicy) {
        // Remove createdBy from payload to prevent overwriting
        const { createdBy, ...updateData } = payload;
        const result = await PrivacyPolicy.findByIdAndUpdate(privacyPolicy._id, updateData, { new: true, runValidators: true }).populate("createdBy");

        return result!;
    } else {
        // Create new with createdBy
        const result = await PrivacyPolicy.create(payload);
        return result;
    }
};

const getPrivacyPolicy = async (): Promise<IPrivacyPolicy | null> => {
    return await PrivacyPolicy.findOne().populate("createdBy");
};

const updatePrivacyPolicy = async (payload: Partial<IPrivacyPolicy>): Promise<IPrivacyPolicy> => {
    const privacyPolicy = await PrivacyPolicy.findOne();

    if (!privacyPolicy) {
        throw new ApiError(httpStatus.NOT_FOUND, "Privacy Policy not found");
    }

    // Remove createdBy from payload to prevent overwriting
    const { createdBy, ...updateData } = payload;
    const result = await PrivacyPolicy.findByIdAndUpdate(privacyPolicy._id, updateData, { new: true, runValidators: true }).populate("createdBy");

    return result!;
};

export const PrivacyPolicyService = {
    createOrUpdatePrivacyPolicy,
    getPrivacyPolicy,
    updatePrivacyPolicy,
};
