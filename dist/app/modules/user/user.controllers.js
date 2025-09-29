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
exports.userControllers = void 0;
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const user_services_1 = require("./user.services");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const getAllUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Use req.query directly or use the parsed filters from middleware
    const filters = req.query;
    const paginationOptions = {
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
    };
    const result = yield user_services_1.userServices.getAllUsersFromDB(filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Users retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getSingleUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield user_services_1.userServices.getSingleUserFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
}));
const deleteMyAccount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const user = yield user_services_1.userServices.softDeleteUserData(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Your account and all related data soft deleted",
        data: user,
    });
}));
const adminDeleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const targetUserId = req.params.userId;
    if (!mongoose_1.Types.ObjectId.isValid(targetUserId)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid user ID");
    }
    const user = yield user_services_1.userServices.softDeleteUserData(new mongoose_1.Types.ObjectId(targetUserId));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User account and all related data soft deleted by admin",
        data: user,
    });
}));
exports.userControllers = { getAllUsers, getSingleUser, deleteMyAccount, adminDeleteUser };
