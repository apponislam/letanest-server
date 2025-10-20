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

// Get all site ratings
const getSiteRatingsController = catchAsync(async (req, res) => {
    const ratings = await ratingServices.getSiteRatingsService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Site ratings retrieved successfully",
        data: ratings,
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
    getPropertyRatingStatsController,
    getSiteRatingsController,
    getSiteRatingStatsController,
    getUserPropertyRatingController,
    getUserSiteRatingController,
    updateRatingController,
    deleteRatingController,
};
