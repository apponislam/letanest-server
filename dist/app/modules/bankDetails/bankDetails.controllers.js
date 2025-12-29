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
exports.bankDetailsControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const bankDetails_services_1 = require("./bankDetails.services");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const createBankDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const bankDetails = yield bankDetails_services_1.bankDetailsServices.createBankDetails(Object.assign(Object.assign({}, req.body), { userId }));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Bank details added successfully",
        data: bankDetails,
    });
}));
// const getMyBankDetails = catchAsync(async (req, res) => {
//     const userId = req.user._id;
//     const bankDetails = await bankDetailsServices.getMyBankDetails(userId);
//     sendResponse(res, {
//         success: true,
//         statusCode: httpStatus.OK,
//         message: "Bank details retrieved successfully",
//         data: bankDetails,
//     });
// });
const getMyBankDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const bankDetails = yield bankDetails_services_1.bankDetailsServices.getMyBankDetails(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: bankDetails ? "Bank details retrieved successfully" : "No bank details found",
        data: bankDetails,
    });
}));
const getBankDetailsByUserId = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const bankDetails = yield bankDetails_services_1.bankDetailsServices.getBankDetailsByUserId(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Bank details retrieved successfully",
        data: bankDetails,
    });
}));
const updateMyBankDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const bankDetails = yield bankDetails_services_1.bankDetailsServices.updateMyBankDetails(userId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Bank details updated successfully",
        data: bankDetails,
    });
}));
const deleteMyBankDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    yield bankDetails_services_1.bankDetailsServices.deleteMyBankDetails(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Bank details deleted successfully",
        data: null,
    });
}));
exports.bankDetailsControllers = {
    createBankDetails,
    getMyBankDetails,
    getBankDetailsByUserId,
    updateMyBankDetails,
    deleteMyBankDetails,
};
