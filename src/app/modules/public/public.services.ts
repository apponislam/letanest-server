import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { roles, TermsAndConditionsModel } from "./public.model";

const createTermsService = async (data: any, userId: string) => {
    data.createdBy = userId;

    // Admin can only have one T&C per role
    if (data.creatorType === roles.ADMIN) {
        const existing = await TermsAndConditionsModel.findOne({ creatorType: roles.ADMIN });
        if (existing) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Admin T&C already exists");
        }
    }

    // Validate propertyId if host T&C is property-specific
    if (data.creatorType === roles.HOST && data.hostTarget === "property" && !data.propertyId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "PropertyId is required for property-specific T&C");
    }

    const term = await TermsAndConditionsModel.create(data);
    return term;
};

const getAllTermsService = async () => {
    return TermsAndConditionsModel.find().populate("createdBy", "name email");
};

const getTermByIdService = async (id: string) => {
    const term = await TermsAndConditionsModel.findById(id).populate("createdBy", "name email");
    if (!term) throw new ApiError(httpStatus.NOT_FOUND, "Terms & Conditions not found");
    return term;
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

const getTermsByCreatorTypeService = async (creatorType: string) => {
    return TermsAndConditionsModel.find({ creatorType }).populate("createdBy", "name email");
};

const getPropertyTermsService = async (propertyId: string) => {
    const term = await TermsAndConditionsModel.findOne({ propertyId }).populate("createdBy", "name email");
    if (!term) throw new ApiError(httpStatus.NOT_FOUND, "Property-specific T&C not found");
    return term;
};

export const termsService = {
    createTermsService,
    getAllTermsService,
    getTermByIdService,
    updateTermService,
    deleteTermService,
    getTermsByCreatorTypeService,
    getPropertyTermsService,
};
