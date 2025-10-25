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
exports.verificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_1 = __importDefault(require("http-status"));
const verification_model_1 = require("./verification.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const auth_model_1 = require("../auth/auth.model");
const createVerification = (verificationData, files, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const verification = new verification_model_1.Verification(Object.assign(Object.assign({}, verificationData), { proofAddress: mapFileInfo(files.proofAddress[0]), proofID: mapFileInfo(files.proofID[0]), userId, dob: new Date(verificationData.dob) }));
        const savedVerification = yield verification.save({ session });
        // Update user verification status to "pending"
        yield auth_model_1.UserModel.findByIdAndUpdate(userId, {
            verificationStatus: "pending",
            isVerifiedByAdmin: false,
        }, { session });
        yield session.commitTransaction();
        return savedVerification;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const getVerificationById = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = { _id: id };
    if (userId) {
        query.userId = userId;
    }
    return yield verification_model_1.Verification.findOne(query);
});
const getVerificationsByUser = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { userId };
    if (query.status) {
        filter.status = query.status;
    }
    const [verifications, total] = yield Promise.all([verification_model_1.Verification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), verification_model_1.Verification.countDocuments(filter)]);
    return {
        verifications,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
const getAllVerifications = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (query.status) {
        filter.status = query.status;
    }
    const [verifications, total] = yield Promise.all([verification_model_1.Verification.find(filter).populate("userId", "email firstName lastName").sort({ createdAt: -1 }).skip(skip).limit(limit), verification_model_1.Verification.countDocuments(filter)]);
    return {
        verifications,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
const updateVerificationStatus = (id, statusData) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const verification = yield verification_model_1.Verification.findById(id).session(session);
        if (!verification) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Verification not found");
        }
        const updateData = {
            status: statusData.status,
            reviewedAt: new Date(),
        };
        if (statusData.reviewNotes) {
            updateData.reviewNotes = statusData.reviewNotes;
        }
        const updatedVerification = yield verification_model_1.Verification.findByIdAndUpdate(id, updateData, { new: true, runValidators: true, session }).populate("userId", "email firstName lastName");
        if (!updatedVerification) {
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update verification");
        }
        const userUpdateData = {
            verificationStatus: statusData.status,
        };
        if (statusData.status === "approved") {
            userUpdateData.isVerifiedByAdmin = true;
        }
        else {
            userUpdateData.isVerifiedByAdmin = false;
        }
        const updatedUser = yield auth_model_1.UserModel.findByIdAndUpdate(updatedVerification.userId._id, userUpdateData, { new: true, runValidators: true, session });
        if (!updatedUser) {
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update user verification status");
        }
        yield session.commitTransaction();
        return updatedVerification;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const deleteVerification = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = { _id: id };
    if (userId) {
        query.userId = userId;
    }
    const verification = yield verification_model_1.Verification.findOne(query);
    if (!verification) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Verification not found");
    }
    return yield verification_model_1.Verification.findOneAndDelete(query);
});
const mapFileInfo = (file) => {
    return {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
    };
};
exports.verificationService = {
    createVerification,
    getVerificationById,
    getVerificationsByUser,
    getAllVerifications,
    updateVerificationStatus,
    deleteVerification,
};
