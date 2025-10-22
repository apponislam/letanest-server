import httpStatus from "http-status";
import { ratingServices } from "./rating.services";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { RatingType } from "./rating.interface";
import ApiError from "../../../errors/ApiError";

// Create a new rating (both property and site)
const createRatingController = catchAsync(async (req, res) => {
    const ratingData = {
        ...req.body,
        userId: req.user?._id,
    };

    const rating = await ratingServices.createRatingService(ratingData);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: `${ratingData.type === "property" ? "Property" : "Site"} rating submitted successfully`,
        data: rating,
    });
});

// Get all ratings for a specific property
const getPropertyRatingsController = catchAsync(async (req, res) => {
    const { propertyId } = req.params;

    const ratings = await ratingServices.getPropertyRatingsService(propertyId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Property ratings retrieved successfully",
        data: ratings,
    });
});

// Get all ratings for a specific host
const getHostRatingsController = catchAsync(async (req, res) => {
    const { hostId } = req.params;

    const ratings = await ratingServices.getHostRatingsService(hostId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host ratings retrieved successfully",
        data: ratings,
    });
});

// Get property rating statistics
const getPropertyRatingStatsController = catchAsync(async (req, res) => {
    const { propertyId } = req.params;

    const stats = await ratingServices.getPropertyRatingStatsService(propertyId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Property rating statistics retrieved successfully",
        data: stats,
    });
});

// Get host rating statistics
const getHostRatingStatsController = catchAsync(async (req, res) => {
    const { hostId } = req.params;

    const stats = await ratingServices.getHostRatingStatsService(hostId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host rating statistics retrieved successfully",
        data: stats,
    });
});

// Get all site ratings
const getSiteRatingsController = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { ratings, total } = await ratingServices.getSiteRatingsService(page, limit);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Site ratings retrieved successfully",
        data: ratings,
        meta: {
            page,
            limit,
            total,
        },
    });
});

// Get site rating statistics
const getSiteRatingStatsController = catchAsync(async (req, res) => {
    const stats = await ratingServices.getSiteRatingStatsService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Site rating statistics retrieved successfully",
        data: stats,
    });
});

// Get user's rating for a specific property
const getUserPropertyRatingController = catchAsync(async (req, res) => {
    const { propertyId } = req.params;
    const userId = req.user?._id;

    const rating = await ratingServices.getUserPropertyRatingService(userId, propertyId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User property rating retrieved successfully",
        data: rating,
    });
});

// Get user's site rating
const getUserSiteRatingController = catchAsync(async (req, res) => {
    const userId = req.user?._id;

    const rating = await ratingServices.getUserSiteRatingService(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User site rating retrieved successfully",
        data: rating,
    });
});

// Get user's ratings for a specific host
const getUserHostRatingsController = catchAsync(async (req, res) => {
    const { hostId } = req.params;
    const userId = req.user?._id;

    const ratings = await ratingServices.getUserHostRatingsService(userId, hostId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User host ratings retrieved successfully",
        data: ratings,
    });
});

// Update a rating
const updateRatingController = catchAsync(async (req, res) => {
    const { ratingId } = req.params;

    const rating = await ratingServices.updateRatingService(ratingId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Rating updated successfully",
        data: rating,
    });
});

// Delete a rating
const deleteRatingController = catchAsync(async (req, res) => {
    const { ratingId } = req.params;

    const rating = await ratingServices.deleteRatingService(ratingId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Rating deleted successfully",
        data: rating,
    });
});

// Get all ratings for admin with filters
const getAllRatingsForAdminController = catchAsync(async (req, res) => {
    const { type, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search } = req.query;

    const filters = {
        type: type as RatingType,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
        search: search as string,
    };

    const result = await ratingServices.getAllRatingsForAdminService(filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All ratings retrieved successfully for admin",
        data: result.ratings,
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
        },
    });
});

// Get rating statistics for admin dashboard
const getAdminRatingStatsController = catchAsync(async (req, res) => {
    const stats = await ratingServices.getAdminRatingStatsService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin rating statistics retrieved successfully",
        data: stats,
    });
});

const checkUserPropertiesRatingController = catchAsync(async (req, res) => {
    const userId = req.user?._id;
    const { propertyIds } = req.body;

    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!propertyIds || !Array.isArray(propertyIds)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Property IDs array is required");
    }

    const result = await ratingServices.checkUserPropertiesRatingService(userId.toString(), propertyIds);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User rating status retrieved successfully",
        data: result,
    });
});

export const ratingControllers = {
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
