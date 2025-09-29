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
exports.userServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const auth_model_1 = require("../auth/auth.model");
const profile_model_1 = require("../profile/profile.model");
const realTimeLocation_model_1 = require("../realTimeLocation/realTimeLocation.model");
const paginationHelper_1 = require("../../../utils/paginationHelper");
const user_constant_1 = require("./user.constant");
const getAllUsersFromDB = (filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sortBy, sortOrder } = (0, paginationHelper_1.calculatePagination)(paginationOptions);
    const { searchTerm } = filters, filtersData = __rest(filters, ["searchTerm"]);
    const andConditions = [];
    // Search implementation
    if (searchTerm) {
        andConditions.push({
            $or: user_constant_1.userSearchableFields.map((field) => ({
                [field]: {
                    $regex: searchTerm,
                    $options: "i",
                },
            })),
        });
    }
    // Filters implementation
    if (Object.keys(filtersData).length) {
        const filterConditions = Object.entries(filtersData).map(([field, value]) => {
            if (field === "isActive") {
                return { [field]: value === "true" || value === true };
            }
            return { [field]: value };
        });
        andConditions.push({ $and: filterConditions });
    }
    // Sort condition
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder;
    }
    const whereCondition = andConditions.length > 0 ? { $and: andConditions } : {};
    const result = yield auth_model_1.UserModel.find(whereCondition).populate("profile").populate("realtimeLocation").sort(sortConditions).skip(skip).limit(limit);
    const total = yield auth_model_1.UserModel.countDocuments(whereCondition);
    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result,
    };
});
const getSingleUserFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_model_1.UserModel.findById(id).populate("profile").populate("realtimeLocation");
    return result;
});
const softDeleteUserData = (targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const now = new Date();
        // Soft delete user
        const user = yield auth_model_1.UserModel.findOneAndUpdate({ _id: targetUserId, isDeleted: false }, { isDeleted: true, deletedAt: now }, { new: true, session });
        if (!user) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found or already deleted");
        }
        yield Promise.all([
            profile_model_1.ProfileModel.findOneAndUpdate({
                user: targetUserId,
                isDeleted: false,
            }, { isDeleted: true, deletedAt: now }, { session }),
            realTimeLocation_model_1.RealtimeLocationModel.findOneAndUpdate({
                user: targetUserId,
                isDeleted: false,
            }, { isDeleted: true, deletedAt: now }, { session }),
        ]);
        yield session.commitTransaction();
        session.endSession();
        return user;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
exports.userServices = { getAllUsersFromDB, getSingleUserFromDB, softDeleteUserData };
