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
exports.termsController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const http_status_1 = __importDefault(require("http-status"));
const public_services_1 = require("./public.services");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const createTermsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id))
        throw new Error("Unauthorized: user not logged in");
    const result = yield public_services_1.termsService.createTermsService(req.body, req.user._id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.CREATED, success: true, message: "Terms & Conditions created successfully", data: result });
}));
const getAllTermsController = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield public_services_1.termsService.getAllTermsService();
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: "Terms & Conditions retrieved successfully", data: result });
}));
const getTermByIdController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield public_services_1.termsService.getTermByIdService(req.params.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: "Terms & Conditions retrieved successfully", data: result });
}));
const getDefaultHostTermsController = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const term = yield public_services_1.termsService.getDefaultHostTermsService();
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: "Default Host Terms & Conditions retrieved successfully", data: term });
}));
const updateTermController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield public_services_1.termsService.updateTermService(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: "Terms & Conditions updated successfully", data: result });
}));
const deleteTermController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield public_services_1.termsService.deleteTermService(req.params.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: "Terms & Conditions deleted successfully", data: null });
}));
const getTermsByTargetController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const terms = yield public_services_1.termsService.getTermsByTargetService(req.params.target);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: `Terms & Conditions for ${req.params.target} retrieved successfully`, data: terms });
}));
// const getPropertyTermsController = catchAsync(async (req, res) => {
//     const term = await termsService.getPropertyTermsService(req.params.propertyId);
//     sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Property-specific Terms & Conditions retrieved successfully", data: term });
// });
const getMyDefaultHostTermsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id))
        throw new Error("Unauthorized: user not logged in");
    const result = yield public_services_1.termsService.getMyDefaultHostTermsService(req.user._id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Default Host Terms & Conditions retrieved successfully",
        data: result,
    });
}));
exports.termsController = {
    createTermsController,
    getAllTermsController,
    getTermByIdController,
    getDefaultHostTermsController,
    updateTermController,
    deleteTermController,
    getTermsByTargetController,
    // getPropertyTermsController,
    getMyDefaultHostTermsController,
};
