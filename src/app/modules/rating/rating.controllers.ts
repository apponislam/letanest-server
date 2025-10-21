import httpStatus from "http-status";
import { ratingServices } from "./rating.services";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";

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

export const ratingControllers = {
    createRatingController,
    getPropertyRatingsController,
    getHostRatingsController, // New controller
    getPropertyRatingStatsController,
    getHostRatingStatsController, // New controller
    getSiteRatingsController,
    getSiteRatingStatsController,
    getUserPropertyRatingController,
    getUserSiteRatingController,
    getUserHostRatingsController, // New controller
    updateRatingController,
    deleteRatingController,
};
