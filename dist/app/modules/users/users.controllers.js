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
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const users_services_1 = require("./users.services");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const getAllUsersController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const usersData = yield users_services_1.userServices.getAllUsersService(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Users retrieved successfully",
        data: usersData.users,
        meta: usersData.meta,
    });
}));
const getSingleUserController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield users_services_1.userServices.getSingleUserService(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: user ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!user,
        message: user ? "User retrieved successfully" : "User not found",
        data: user || null,
    });
}));
const updateUserProfileController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone,
        address: {
            street: req.body.address,
            country: req.body.country,
            city: req.body.city,
            zip: req.body.zip,
        },
    };
    const profileImg = req.file;
    const updatedUser = yield users_services_1.userServices.updateUserProfileService(userId, updateData, profileImg);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
    });
}));
const getMySubscriptionsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const user = yield users_services_1.userServices.getMySubscriptionsService(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User subscriptions retrieved successfully",
        data: user,
    });
}));
// ONLY THIS NEW CONTROLLER - Activate free tier
const activateFreeTierController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { subscriptionId } = req.body;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    if (!subscriptionId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Subscription ID is required");
    }
    const freeTierData = yield users_services_1.userServices.activateFreeTierService(userId, subscriptionId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Free tier activated successfully",
        data: freeTierData,
    });
}));
// Connect Stripe account
const connectStripeAccountController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const result = yield users_services_1.userServices.connectStripeAccountService(userId.toString());
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Stripe account connected successfully",
        data: result,
    });
}));
// Get Stripe account status
const getStripeAccountStatusController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const result = yield users_services_1.userServices.getStripeAccountStatusService(userId.toString());
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Stripe account status retrieved successfully",
        data: result,
    });
}));
// Get Stripe dashboard
const getStripeDashboardController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const result = yield users_services_1.userServices.getStripeDashboardService(userId.toString());
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Stripe dashboard link retrieved successfully",
        data: result,
    });
}));
// Disconnect Stripe account
const disconnectStripeAccountController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const result = yield users_services_1.userServices.disconnectStripeAccountService(userId.toString());
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Stripe account disconnected successfully",
        data: result,
    });
}));
const getMyProfileController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const user = yield users_services_1.userServices.getMyProfileService(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User profile retrieved successfully",
        data: user,
    });
}));
const getRandomAdminController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield users_services_1.userServices.getRandomAdminService();
    (0, sendResponse_1.default)(res, {
        statusCode: admin ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!admin,
        message: admin ? "Random admin retrieved successfully" : "No admin found",
        data: admin || null,
    });
}));
exports.userControllers = {
    getAllUsersController,
    getSingleUserController,
    updateUserProfileController,
    getMySubscriptionsController,
    activateFreeTierController,
    // stripe
    connectStripeAccountController,
    getStripeAccountStatusController,
    getStripeDashboardController,
    disconnectStripeAccountController,
    // get my profile
    getMyProfileController,
    // randorm admin
    getRandomAdminController,
};
