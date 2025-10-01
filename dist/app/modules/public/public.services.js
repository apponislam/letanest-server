"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.termsService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const public_model_1 = require("./public.model");
const createTermsService = (data, userId) => __awaiter(void 0, void 0, void 0, function* () {
    data.createdBy = userId;
    // Admin can only have one T&C per role
    if (data.creatorType === public_model_1.roles.ADMIN) {
        const existing = yield public_model_1.TermsAndConditionsModel.findOne({ creatorType: public_model_1.roles.ADMIN });
        if (existing) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Admin T&C already exists");
        }
    }
    // Validate propertyId if host T&C is property-specific
    if (data.creatorType === public_model_1.roles.HOST && data.hostTarget === "property" && !data.propertyId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "PropertyId is required for property-specific T&C");
    }
    const term = yield public_model_1.TermsAndConditionsModel.create(data);
    return term;
});
const getAllTermsService = () => __awaiter(void 0, void 0, void 0, function* () {
    return public_model_1.TermsAndConditionsModel.find().populate("createdBy", "name email");
});
const getTermByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const term = yield public_model_1.TermsAndConditionsModel.findById(id).populate("createdBy", "name email");
    if (!term)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Terms & Conditions not found");
    return term;
});
const updateTermService = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const term = yield public_model_1.TermsAndConditionsModel.findByIdAndUpdate(id, data, { new: true });
    if (!term)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Terms & Conditions not found");
    return term;
});
const deleteTermService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const term = yield public_model_1.TermsAndConditionsModel.findByIdAndDelete(id);
    if (!term)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Terms & Conditions not found");
    return term;
});
const getTermsByCreatorTypeService = (creatorType) => __awaiter(void 0, void 0, void 0, function* () {
    return public_model_1.TermsAndConditionsModel.find({ creatorType }).populate("createdBy", "name email");
});
const getPropertyTermsService = (propertyId) => __awaiter(void 0, void 0, void 0, function* () {
    const term = yield public_model_1.TermsAndConditionsModel.findOne({ propertyId }).populate("createdBy", "name email");
    if (!term)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Property-specific T&C not found");
    return term;
});
exports.termsService = {
    createTermsService,
    getAllTermsService,
    getTermByIdService,
    updateTermService,
    deleteTermService,
    getTermsByCreatorTypeService,
    getPropertyTermsService,
};
