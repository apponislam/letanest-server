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
exports.PrivacyPolicyService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const privacyPolicy_model_1 = require("./privacyPolicy.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createOrUpdatePrivacyPolicy = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let privacyPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findOne();
    if (privacyPolicy) {
        // Remove createdBy from payload to prevent overwriting
        const { createdBy } = payload, updateData = __rest(payload, ["createdBy"]);
        const result = yield privacyPolicy_model_1.PrivacyPolicy.findByIdAndUpdate(privacyPolicy._id, updateData, { new: true, runValidators: true }).populate("createdBy");
        return result;
    }
    else {
        // Create new with createdBy
        const result = yield privacyPolicy_model_1.PrivacyPolicy.create(payload);
        return result;
    }
});
const getPrivacyPolicy = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield privacyPolicy_model_1.PrivacyPolicy.findOne().populate("createdBy");
});
const updatePrivacyPolicy = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const privacyPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findOne();
    if (!privacyPolicy) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Privacy Policy not found");
    }
    // Remove createdBy from payload to prevent overwriting
    const { createdBy } = payload, updateData = __rest(payload, ["createdBy"]);
    const result = yield privacyPolicy_model_1.PrivacyPolicy.findByIdAndUpdate(privacyPolicy._id, updateData, { new: true, runValidators: true }).populate("createdBy");
    return result;
});
exports.PrivacyPolicyService = {
    createOrUpdatePrivacyPolicy,
    getPrivacyPolicy,
    updatePrivacyPolicy,
};
