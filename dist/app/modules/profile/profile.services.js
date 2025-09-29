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
exports.profileServices = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const profile_model_1 = require("./profile.model");
const createOrUpdateProfile = (userId, profileData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Unauthorized");
    const existingProfile = yield profile_model_1.ProfileModel.findOne({ user: userId }).exec();
    const updatedData = Object.assign({}, profileData);
    if (profileData.emergencyContacts && (existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.emergencyContacts)) {
        updatedData.emergencyContacts = [...existingProfile.emergencyContacts, ...profileData.emergencyContacts];
    }
    if (profileData.medicalNotes && (existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.medicalNotes)) {
        updatedData.medicalNotes = [...existingProfile.medicalNotes, ...profileData.medicalNotes];
    }
    const profile = yield profile_model_1.ProfileModel.findOneAndUpdate({ user: userId }, { $set: updatedData }, { new: true, upsert: true, setDefaultsOnInsert: true }).exec();
    if (!profile)
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update profile");
    return profile;
});
exports.profileServices = {
    createOrUpdateProfile,
};
