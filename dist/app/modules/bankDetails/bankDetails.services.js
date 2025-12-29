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
exports.bankDetailsServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const bankDetails_model_1 = require("./bankDetails.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
// const createBankDetails = async (payload: ICreateBankDetails & { userId: string }): Promise<IBankDetails> => {
//     const existingBankDetails = await BankDetails.findOne({
//         userId: payload.userId,
//         isActive: true,
//     });
//     if (existingBankDetails) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Bank details already exist for this user");
//     }
//     const bankDetails = await BankDetails.create(payload);
//     return bankDetails;
// };
const createBankDetails = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = payload.country) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "uk" || ((_b = payload.country) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "united kingdom") {
        const sortCodeRegex = /^\d{6}$|^\d{2}-\d{2}-\d{2}$/;
        if (!sortCodeRegex.test(payload.sortCode)) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid sort code format. Use 6 digits (123456) or format (12-34-56)");
        }
        if (!/^\d{8}$/.test(payload.accountNumber)) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "UK account number must be 8 digits");
        }
    }
    const existingBankDetails = yield bankDetails_model_1.BankDetails.findOne({
        userId: payload.userId,
        isActive: true,
    });
    if (existingBankDetails) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Bank details already exist for this user");
    }
    const bankDetails = yield bankDetails_model_1.BankDetails.create(payload);
    return bankDetails;
});
// const getMyBankDetails = async (userId: string): Promise<IBankDetails | null> => {
//     const bankDetails = await BankDetails.findOne({
//         userId,
//         isActive: true,
//     });
//     if (!bankDetails) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Bank details not found");
//     }
//     return bankDetails;
// };
const getMyBankDetails = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const bankDetails = yield bankDetails_model_1.BankDetails.findOne({
        userId,
        isActive: true,
    });
    return bankDetails;
});
const getBankDetailsByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const bankDetails = yield bankDetails_model_1.BankDetails.findOne({
        userId,
        isActive: true,
    });
    if (!bankDetails) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Bank details not found for this user");
    }
    return bankDetails;
});
const updateMyBankDetails = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const bankDetails = yield bankDetails_model_1.BankDetails.findOneAndUpdate({
        userId,
        isActive: true,
    }, payload, { new: true });
    if (!bankDetails) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Bank details not found");
    }
    return bankDetails;
});
const deleteMyBankDetails = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const bankDetails = yield bankDetails_model_1.BankDetails.findOneAndUpdate({
        userId,
        isActive: true,
    }, { isActive: false }, { new: true });
    if (!bankDetails) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Bank details not found");
    }
});
exports.bankDetailsServices = {
    createBankDetails,
    getMyBankDetails,
    getBankDetailsByUserId,
    updateMyBankDetails,
    deleteMyBankDetails,
};
