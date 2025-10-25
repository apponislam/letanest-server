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
exports.ratingControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const rating_services_1 = require("./rating.services");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
// Create a new rating (both property and site)
const createRatingController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const ratingData = Object.assign(Object.assign({}, req.body), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
    const rating = yield rating_services_1.ratingServices.createRatingService(ratingData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: `${ratingData.type === "property" ? "Property" : "Site"} rating submitted successfully`,
        data: rating,
    });
}));
// Get all ratings for a specific property
const getPropertyRatingsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { propertyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { ratings, total } = yield rating_services_1.ratingServices.getPropertyRatingsService(propertyId, page, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Property ratings retrieved successfully",
        data: ratings,
        meta: { page, limit, total },
    });
}));
// Get all ratings for a specific host
const getHostRatingsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { hostId } = req.params;
    const ratings = yield rating_services_1.ratingServices.getHostRatingsService(hostId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Host ratings retrieved successfully",
        data: ratings,
    });
}));
// Get property rating statistics
const getPropertyRatingStatsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { propertyId } = req.params;
    const stats = yield rating_services_1.ratingServices.getPropertyRatingStatsService(propertyId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Property rating statistics retrieved successfully",
        data: stats,
    });
}));
// Get host rating statistics
const getHostRatingStatsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { hostId } = req.params;
    const stats = yield rating_services_1.ratingServices.getHostRatingStatsService(hostId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Host rating statistics retrieved successfully",
        data: stats,
    });
}));
// Get all site ratings
const getSiteRatingsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { ratings, total } = yield rating_services_1.ratingServices.getSiteRatingsService(page, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Site ratings retrieved successfully",
        data: ratings,
        meta: {
            page,
            limit,
            total,
        },
    });
}));
// Get site rating statistics
const getSiteRatingStatsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield rating_services_1.ratingServices.getSiteRatingStatsService();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Site rating statistics retrieved successfully",
        data: stats,
    });
}));
// Get user's rating for a specific property
const getUserPropertyRatingController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { propertyId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const rating = yield rating_services_1.ratingServices.getUserPropertyRatingService(userId, propertyId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User property rating retrieved successfully",
        data: rating,
    });
}));
// Get user's site rating
const getUserSiteRatingController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const rating = yield rating_services_1.ratingServices.getUserSiteRatingService(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User site rating retrieved successfully",
        data: rating,
    });
}));
// Get user's ratings for a specific host
const getUserHostRatingsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { hostId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const ratings = yield rating_services_1.ratingServices.getUserHostRatingsService(userId, hostId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User host ratings retrieved successfully",
        data: ratings,
    });
}));
// Update a rating
const updateRatingController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ratingId } = req.params;
    const rating = yield rating_services_1.ratingServices.updateRatingService(ratingId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Rating updated successfully",
        data: rating,
    });
}));
// Delete a rating
const deleteRatingController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ratingId } = req.params;
    const rating = yield rating_services_1.ratingServices.deleteRatingService(ratingId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Rating deleted successfully",
        data: rating,
    });
}));
// Get all ratings for admin with filters
const getAllRatingsForAdminController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search } = req.query;
    const filters = {
        type: type,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
        sortOrder: sortOrder,
        search: search,
    };
    const result = yield rating_services_1.ratingServices.getAllRatingsForAdminService(filters);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All ratings retrieved successfully for admin",
        data: result.ratings,
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
        },
    });
}));
// Get rating statistics for admin dashboard
const getAdminRatingStatsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield rating_services_1.ratingServices.getAdminRatingStatsService();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Admin rating statistics retrieved successfully",
        data: stats,
    });
}));
const checkUserPropertiesRatingController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { propertyIds } = req.body;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    if (!propertyIds || !Array.isArray(propertyIds)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Property IDs array is required");
    }
    const result = yield rating_services_1.ratingServices.checkUserPropertiesRatingService(userId.toString(), propertyIds);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User rating status retrieved successfully",
        data: result,
    });
}));
exports.ratingControllers = {
    createRatingController,
    getPropertyRatingsController,
    getHostRatingsController,
    getPropertyRatingStatsController,
    getHostRatingStatsController,
    getSiteRatingsController,
    getSiteRatingStatsController,
    getUserPropertyRatingController,
    getUserSiteRatingController,
    getUserHostRatingsController,
    updateRatingController,
    deleteRatingController,
    // for new admin purposes
    getAllRatingsForAdminController,
    getAdminRatingStatsController,
    // check rated properties
    checkUserPropertiesRatingController,
};
