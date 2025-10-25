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
exports.pageConfigServices = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const pages_model_1 = require("./pages.model");
const getPageConfigService = (pageType) => __awaiter(void 0, void 0, void 0, function* () {
    return yield pages_model_1.PageConfigModel.findOne({ pageType, isActive: true });
});
const getAllPageConfigsService = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield pages_model_1.PageConfigModel.find({ isActive: true }).sort({ pageType: 1 });
});
const upsertPageConfigService = (pageType, updateData, logoFile) => __awaiter(void 0, void 0, void 0, function* () {
    // If there's a new logo file, update the logo path
    if (logoFile) {
        updateData.logo = `/uploads/pages/${logoFile.filename}`;
    }
    // Find existing config for this page type
    const existingConfig = yield pages_model_1.PageConfigModel.findOne({ pageType });
    if (existingConfig) {
        // Update existing config
        const updatedConfig = yield pages_model_1.PageConfigModel.findByIdAndUpdate(existingConfig._id, updateData, { new: true, runValidators: true });
        if (!updatedConfig) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Page configuration not found");
        }
        return updatedConfig;
    }
    else {
        // Create only if doesn't exist (first time setup)
        const newConfig = yield pages_model_1.PageConfigModel.create({
            pageType,
            title: updateData.title || (pageType === "signin" ? "Sign In" : "Sign Up"),
            logo: updateData.logo || "",
            isActive: true,
        });
        return newConfig;
    }
});
const deletePageConfigService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield pages_model_1.PageConfigModel.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Page configuration not found");
    }
});
exports.pageConfigServices = {
    getPageConfigService,
    getAllPageConfigsService,
    upsertPageConfigService,
    deletePageConfigService,
};
