"use strict";
// import httpStatus from "http-status";
// import { ratingServices } from "./rating.services";
// import catchAsync from "../../../utils/catchAsync";
// import sendResponse from "../../../utils/sendResponse.";
// import { RatingType, RatingStatus } from "./rating.interface";
// import ApiError from "../../../errors/ApiError";
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
// // Create a new rating
// const createRatingController = catchAsync(async (req, res) => {
//     const ratingData = {
//         ...req.body,
//         userId: req.user?._id,
//     };
//     const rating = await ratingServices.createRatingService(ratingData);
//     sendResponse(res, {
//         statusCode: httpStatus.CREATED,
//         success: true,
//         message: `${ratingData.type === "property" ? "Property" : "Site"} rating submitted successfully`,
//         data: rating,
//     });
// });
// // Get all ratings for a specific property
// const getPropertyRatingsController = catchAsync(async (req, res) => {
//     const { propertyId } = req.params;
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const { ratings, total } = await ratingServices.getPropertyRatingsService(propertyId, page, limit);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Property ratings retrieved successfully",
//         data: ratings,
//         meta: { page, limit, total },
//     });
// });
// // Get all ratings for a specific host
// const getHostRatingsController = catchAsync(async (req, res) => {
//     const { hostId } = req.params;
//     const ratings = await ratingServices.getHostRatingsService(hostId);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Host ratings retrieved successfully",
//         data: ratings,
//     });
// });
// // Get property rating statistics
// const getPropertyRatingStatsController = catchAsync(async (req, res) => {
//     const { propertyId } = req.params;
//     const stats = await ratingServices.getPropertyRatingStatsService(propertyId);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Property rating statistics retrieved successfully",
//         data: stats,
//     });
// });
// // Get host rating statistics
// const getHostRatingStatsController = catchAsync(async (req, res) => {
//     const { hostId } = req.params;
//     const stats = await ratingServices.getHostRatingStatsService(hostId);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Host rating statistics retrieved successfully",
//         data: stats,
//     });
// });
// // Get all site ratings
// const getSiteRatingsController = catchAsync(async (req, res) => {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const { ratings, total } = await ratingServices.getSiteRatingsService(page, limit);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Site ratings retrieved successfully",
//         data: ratings,
//         meta: { page, limit, total },
//     });
// });
// // Get site rating statistics
// const getSiteRatingStatsController = catchAsync(async (req, res) => {
//     const stats = await ratingServices.getSiteRatingStatsService();
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Site rating statistics retrieved successfully",
//         data: stats,
//     });
// });
// // Get user's rating for a specific property
// const getUserPropertyRatingController = catchAsync(async (req, res) => {
//     const { propertyId } = req.params;
//     const userId = req.user?._id;
//     const rating = await ratingServices.getUserPropertyRatingService(userId, propertyId);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "User property rating retrieved successfully",
//         data: rating,
//     });
// });
// // Get user's site rating
// const getUserSiteRatingController = catchAsync(async (req, res) => {
//     const userId = req.user?._id;
//     const rating = await ratingServices.getUserSiteRatingService(userId);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "User site rating retrieved successfully",
//         data: rating,
//     });
// });
// // Get user's ratings for a specific host
// const getUserHostRatingsController = catchAsync(async (req, res) => {
//     const { hostId } = req.params;
//     const userId = req.user?._id;
//     const ratings = await ratingServices.getUserHostRatingsService(userId, hostId);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "User host ratings retrieved successfully",
//         data: ratings,
//     });
// });
// // Update a rating
// const updateRatingController = catchAsync(async (req, res) => {
//     const { ratingId } = req.params;
//     const rating = await ratingServices.updateRatingService(ratingId, req.body);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Rating updated successfully",
//         data: rating,
//     });
// });
// // Delete a rating
// const deleteRatingController = catchAsync(async (req, res) => {
//     const { ratingId } = req.params;
//     const rating = await ratingServices.deleteRatingService(ratingId);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Rating deleted successfully",
//         data: rating,
//     });
// });
// // Get all ratings for admin with filters
// const getAllRatingsForAdminController = catchAsync(async (req, res) => {
//     const { type, status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search } = req.query;
//     const filters = {
//         type: type as RatingType,
//         status: status as RatingStatus,
//         page: parseInt(page as string),
//         limit: parseInt(limit as string),
//         sortBy: sortBy as string,
//         sortOrder: sortOrder as "asc" | "desc",
//         search: search as string,
//     };
//     const result = await ratingServices.getAllRatingsForAdminService(filters);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "All ratings retrieved successfully for admin",
//         data: result.ratings,
//         meta: {
//             page: result.page,
//             limit: result.limit,
//             total: result.total,
//         },
//     });
// });
// // Get rating statistics for admin dashboard
// const getAdminRatingStatsController = catchAsync(async (req, res) => {
//     const stats = await ratingServices.getAdminRatingStatsService();
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Admin rating statistics retrieved successfully",
//         data: stats,
//     });
// });
// // Check user properties rating
// const checkUserPropertiesRatingController = catchAsync(async (req, res) => {
//     const userId = req.user?._id;
//     const { propertyIds } = req.body;
//     if (!userId) {
//         throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
//     }
//     if (!propertyIds || !Array.isArray(propertyIds)) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Property IDs array is required");
//     }
//     const result = await ratingServices.checkUserPropertiesRatingService(userId.toString(), propertyIds);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "User rating status retrieved successfully",
//         data: result,
//     });
// });
// // Update rating status (admin only)
// const updateRatingStatusController = catchAsync(async (req, res) => {
//     const { ratingId } = req.params;
//     const { status } = req.body;
//     if (!Object.values(RatingStatus).includes(status)) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status value");
//     }
//     const rating = await ratingServices.updateRatingStatusService(ratingId, status);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: `Rating ${status} successfully`,
//         data: rating,
//     });
// });
// export const ratingControllers = {
//     createRatingController,
//     getPropertyRatingsController,
//     getHostRatingsController,
//     getPropertyRatingStatsController,
//     getHostRatingStatsController,
//     getSiteRatingsController,
//     getSiteRatingStatsController,
//     getUserPropertyRatingController,
//     getUserSiteRatingController,
//     getUserHostRatingsController,
//     updateRatingController,
//     deleteRatingController,
//     getAllRatingsForAdminController,
//     getAdminRatingStatsController,
//     checkUserPropertiesRatingController,
//     updateRatingStatusController,
// };
const http_status_1 = __importDefault(require("http-status"));
const rating_services_1 = require("./rating.services");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const rating_interface_1 = require("./rating.interface");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
// Create a new rating
const createRatingController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const ratingData = Object.assign(Object.assign({}, req.body), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
    const rating = yield rating_services_1.ratingServices.createRatingService(ratingData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: `${ratingData.type === "property" ? "Property" : ratingData.type === "guest" ? "Guest" : "Site"} rating submitted successfully`,
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
// Get all ratings for a specific user (BOTH host and guest ratings)
const getUserRatingsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { ratings, total } = yield rating_services_1.ratingServices.getUserRatingsService(userId, page, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User ratings retrieved successfully",
        data: ratings,
        meta: { page, limit, total },
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
// Get user rating statistics (BOTH host and guest ratings)
const getUserRatingStatsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const stats = yield rating_services_1.ratingServices.getUserRatingStatsService(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User rating statistics retrieved successfully",
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
        meta: { page, limit, total },
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
// Get user's ratings for a specific reviewed user (BOTH host and guest ratings)
const getUserRatingsForReviewedController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { reviewedId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const ratings = yield rating_services_1.ratingServices.getUserRatingsForReviewedService(userId, reviewedId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User ratings retrieved successfully",
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
    const { type, status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search } = req.query;
    const filters = {
        type: type,
        status: status,
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
// Check user properties rating
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
// Update rating status (admin only)
const updateRatingStatusController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ratingId } = req.params;
    const { status } = req.body;
    if (!Object.values(rating_interface_1.RatingStatus).includes(status)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid status value");
    }
    const rating = yield rating_services_1.ratingServices.updateRatingStatusService(ratingId, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Rating ${status} successfully`,
        data: rating,
    });
}));
exports.ratingControllers = {
    createRatingController,
    getPropertyRatingsController,
    getUserRatingsController,
    getPropertyRatingStatsController,
    getUserRatingStatsController,
    getSiteRatingsController,
    getSiteRatingStatsController,
    getUserPropertyRatingController,
    getUserSiteRatingController,
    getUserRatingsForReviewedController,
    updateRatingController,
    deleteRatingController,
    getAllRatingsForAdminController,
    getAdminRatingStatsController,
    checkUserPropertiesRatingController,
    updateRatingStatusController,
};
