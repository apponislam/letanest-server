import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { roles, TermsAndConditionsModel } from "./public.model";

const createTermsService = async (data: any, userId: string) => {
    const { id, ...cleanData } = data;

    cleanData.createdBy = userId;

    // EXTREMELY IMPORTANT: Remove ALL id fields that might cause conflicts
    const finalData = { ...cleanData };
    delete finalData.id;
    delete finalData._id;
    delete finalData.__id;
    delete finalData.$id;

    console.log("🔍 Final data before create:", finalData);

    if (finalData.creatorType === roles.ADMIN) {
        const existing = await TermsAndConditionsModel.findOne({
            creatorType: roles.ADMIN,
            target: finalData.target,
        });

        console.log("🔍 Existing admin terms check:", {
            creatorType: roles.ADMIN,
            target: finalData.target,
            found: existing,
        });

        if (existing) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Admin T&C for ${finalData.target} already exists`);
        }
    }

    console.log("✅ Creating new terms with final data:", finalData);
    return TermsAndConditionsModel.create(finalData);
};

const getAllTermsService = async () => {
    return TermsAndConditionsModel.find().populate("createdBy", "name email");
};

const getTermByIdService = async (id: string) => {
    const term = await TermsAndConditionsModel.findById(id).populate("createdBy", "name email");
    if (!term) throw new ApiError(httpStatus.NOT_FOUND, "Terms & Conditions not found");
    return term;
};

const getDefaultHostTermsService = async () => {
    return TermsAndConditionsModel.findOne({ creatorType: roles.HOST, hostTarget: "default" }).populate("createdBy", "name email");
};

const updateTermService = async (id: string, data: any) => {
    const term = await TermsAndConditionsModel.findByIdAndUpdate(id, data, { new: true });
    if (!term) throw new ApiError(httpStatus.NOT_FOUND, "Terms & Conditions not found");
    return term;
};

const deleteTermService = async (id: string) => {
    const term = await TermsAndConditionsModel.findByIdAndDelete(id);
    if (!term) throw new ApiError(httpStatus.NOT_FOUND, "Terms & Conditions not found");
    return term;
};

const getTermsByTargetService = async (target: string) => {
    return TermsAndConditionsModel.find({ target }).populate("createdBy", "name email");
};

const getMyDefaultHostTermsService = async (userId: string) => {
    const defaultTerms = await TermsAndConditionsModel.findOne({
        hostTarget: "default",
        createdBy: userId,
    });

    if (!defaultTerms) {
        throw new ApiError(httpStatus.NOT_FOUND, "Default host terms and conditions not found for this user");
    }

    return defaultTerms;
};

export const termsService = {
    createTermsService,
    getAllTermsService,
    getTermByIdService,
    getDefaultHostTermsService,
    updateTermService,
    deleteTermService,
    getTermsByTargetService,
    // getPropertyTermsService,
    getMyDefaultHostTermsService,
};
