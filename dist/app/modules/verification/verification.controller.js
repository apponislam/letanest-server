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
exports.verificationController = void 0;
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const verification_service_1 = require("./verification.service");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const verification_validation_1 = require("./verification.validation");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const submitVerification = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const validatedData = verification_validation_1.verifySchema.parse(req.body);
    if (!req.files || !req.files.proofAddress || !req.files.proofID) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Both proof of address and proof of ID files are required");
    }
    const files = req.files;
    const userId = new mongoose_1.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    const verification = yield verification_service_1.verificationService.createVerification(validatedData, files, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Verification submitted successfully",
        data: verification,
    });
}));
const getUserVerifications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = new mongoose_1.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    const result = yield verification_service_1.verificationService.getVerificationsByUser(userId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Verifications retrieved successfully",
        data: result.verifications,
        meta: result.meta,
    });
}));
const getVerification = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) ? new mongoose_1.Types.ObjectId(req.user.id) : undefined;
    const verification = yield verification_service_1.verificationService.getVerificationById(id, userId);
    if (!verification) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Verification not found");
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Verification retrieved successfully",
        data: verification,
    });
}));
const getAllVerifications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield verification_service_1.verificationService.getAllVerifications(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Verifications retrieved successfully",
        data: result.verifications,
        meta: result.meta,
    });
}));
const updateStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const validatedData = verification_validation_1.updateStatusSchema.parse(req.body);
    const verification = yield verification_service_1.verificationService.updateVerificationStatus(id, validatedData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Verification status updated successfully",
        data: verification,
    });
}));
const deleteVerification = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) ? new mongoose_1.Types.ObjectId(req.user.id) : undefined;
    const verification = yield verification_service_1.verificationService.deleteVerification(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Verification deleted successfully",
        data: verification,
    });
}));
const serveFile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, fileType } = req.params;
    if (fileType !== "proofAddress" && fileType !== "proofID") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid file type");
    }
    const verification = yield verification_service_1.verificationService.getVerificationById(id);
    if (!verification) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Verification not found");
    }
    const fileInfo = verification[fileType];
    if (!fileInfo || !fileInfo.path) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "File not found");
    }
    res.setHeader("Content-Type", fileInfo.mimetype);
    res.setHeader("Content-Disposition", `inline; filename="${fileInfo.originalName}"`);
    res.sendFile(fileInfo.path, { root: "." });
}));
exports.verificationController = {
    submitVerification,
    getUserVerifications,
    getVerification,
    getAllVerifications,
    updateStatus,
    deleteVerification,
    serveFile,
};
