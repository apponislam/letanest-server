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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
    const { id } = data, cleanData = __rest(data, ["id"]);
    cleanData.createdBy = userId;
    const finalData = Object.assign({}, cleanData);
    delete finalData.id;
    delete finalData._id;
    delete finalData.__id;
    delete finalData.$id;
    console.log("🔍 Final data before create:", finalData);
    if (finalData.creatorType === public_model_1.roles.ADMIN) {
        const existing = yield public_model_1.TermsAndConditionsModel.findOne({
            creatorType: public_model_1.roles.ADMIN,
            target: finalData.target,
        });
        if (existing) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Admin T&C for ${finalData.target} already exists`);
        }
    }
    console.log("✅ Creating new terms with final data:", finalData);
    return public_model_1.TermsAndConditionsModel.create(finalData);
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
const getDefaultHostTermsService = () => __awaiter(void 0, void 0, void 0, function* () {
    return public_model_1.TermsAndConditionsModel.findOne({ creatorType: public_model_1.roles.HOST, hostTarget: "default" }).populate("createdBy", "name email");
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
const getTermsByTargetService = (target) => __awaiter(void 0, void 0, void 0, function* () {
    return public_model_1.TermsAndConditionsModel.find({ target }).populate("createdBy", "name email");
});
const getMyDefaultHostTermsService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const defaultTerms = yield public_model_1.TermsAndConditionsModel.findOne({
        hostTarget: "default",
        createdBy: userId,
    });
    if (!defaultTerms) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Default host terms and conditions not found for this user");
    }
    return defaultTerms;
});
const getPropertyTermsService = () => __awaiter(void 0, void 0, void 0, function* () {
    return public_model_1.TermsAndConditionsModel.findOne({ target: "property" }).populate("createdBy", "name email");
});
exports.termsService = {
    createTermsService,
    getAllTermsService,
    getTermByIdService,
    getDefaultHostTermsService,
    updateTermService,
    deleteTermService,
    getTermsByTargetService,
    // getPropertyTermsService,
    getMyDefaultHostTermsService,
    getPropertyTermsService,
};
