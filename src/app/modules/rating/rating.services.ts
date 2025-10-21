import httpStatus from "http-status";
import mongoose from "mongoose";
import { IRating, RatingType } from "./rating.interface";
import ApiError from "../../../errors/ApiError";
import { RatingModel } from "./rating.model";

interface CreateRatingData {
    type: RatingType;
    userId: mongoose.Types.ObjectId;
    propertyId?: mongoose.Types.ObjectId;
    hostId?: mongoose.Types.ObjectId; // Added hostId
    communication?: number;
    accuracy?: number;
    cleanliness?: number;
    checkInExperience?: number;
    overallExperience: number;
    country?: string;
    description?: string;
}

interface PropertyRatingStats {
    averageRating: number;
    totalRatings: number;
    communication: number;
    accuracy: number;
    cleanliness: number;
    checkInExperience: number;
    overallExperience: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

interface SiteRatingStats {
    averageRating: number;
    totalRatings: number;
    countryStats: { country: string; count: number; average: number }[];
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

// User population fields
const userPopulationFields = "name email phone profileImg role";

// Property population fields
const propertyPopulationFields = "title description location propertyType maxGuests bedrooms bathrooms price coverPhoto photos status";

// Create a new rating
const createRatingService = async (ratingData: CreateRatingData): Promise<IRating> => {
    // Validate propertyId and hostId are provided for property ratings
    if (ratingData.type === RatingType.PROPERTY) {
        if (!ratingData.propertyId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Property ID is required for property ratings");
        }
        if (!ratingData.hostId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Host ID is required for property ratings");
        }

        // Validate property-specific fields
        const requiredFields = ["communication", "accuracy", "cleanliness", "checkInExperience"];
        for (const field of requiredFields) {
            if (!(field in ratingData)) {
                throw new ApiError(httpStatus.BAD_REQUEST, `${field} is required for property ratings`);
            }
        }

        // Check if user already rated this property
        const existingRating = await RatingModel.findOne({
            userId: ratingData.userId,
            propertyId: ratingData.propertyId,
            type: RatingType.PROPERTY,
        });

        if (existingRating) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You have already rated this property");
        }
    }

    // Validate country is provided for site ratings
    if (ratingData.type === RatingType.SITE && !ratingData.country) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Country is required for site ratings");
    }

    // Check if user already rated the site (for site ratings)
    if (ratingData.type === RatingType.SITE) {
        const existingRating = await RatingModel.findOne({
            userId: ratingData.userId,
            type: RatingType.SITE,
        });

        if (existingRating) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You have already rated the site");
        }
    }

    const rating = await RatingModel.create(ratingData);

    // Populate the created rating
    const populatedRating = await RatingModel.findById(rating._id).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields); // Populate host info

    return populatedRating as IRating;
};

// Get all ratings for a specific property
const getPropertyRatingsService = async (propertyId: string): Promise<IRating[]> => {
    const ratings = await RatingModel.find({
        propertyId: new mongoose.Types.ObjectId(propertyId),
        type: RatingType.PROPERTY,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields)
        .sort({ createdAt: -1 });

    return ratings;
};

// Get all ratings for a specific host
const getHostRatingsService = async (hostId: string): Promise<IRating[]> => {
    const ratings = await RatingModel.find({
        hostId: new mongoose.Types.ObjectId(hostId),
        type: RatingType.PROPERTY,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields)
        .sort({ createdAt: -1 });

    return ratings;
};

// Get property rating statistics
const getPropertyRatingStatsService = async (propertyId: string): Promise<PropertyRatingStats> => {
    const stats = await RatingModel.aggregate([
        {
            $match: {
                propertyId: new mongoose.Types.ObjectId(propertyId),
                type: RatingType.PROPERTY,
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$overallExperience" },
                totalRatings: { $sum: 1 },
                communication: { $avg: "$communication" },
                accuracy: { $avg: "$accuracy" },
                cleanliness: { $avg: "$cleanliness" },
                checkInExperience: { $avg: "$checkInExperience" },
                overallExperience: { $avg: "$overallExperience" },
                rating1: { $sum: { $cond: [{ $eq: ["$overallExperience", 1] }, 1, 0] } },
                rating2: { $sum: { $cond: [{ $eq: ["$overallExperience", 2] }, 1, 0] } },
                rating3: { $sum: { $cond: [{ $eq: ["$overallExperience", 3] }, 1, 0] } },
                rating4: { $sum: { $cond: [{ $eq: ["$overallExperience", 4] }, 1, 0] } },
                rating5: { $sum: { $cond: [{ $eq: ["$overallExperience", 5] }, 1, 0] } },
            },
        },
    ]);

    if (stats.length === 0) {
        return {
            averageRating: 0,
            totalRatings: 0,
            communication: 0,
            accuracy: 0,
            cleanliness: 0,
            checkInExperience: 0,
            overallExperience: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }

    const stat = stats[0];
    return {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalRatings: stat.totalRatings,
        communication: Math.round(stat.communication * 10) / 10,
        accuracy: Math.round(stat.accuracy * 10) / 10,
        cleanliness: Math.round(stat.cleanliness * 10) / 10,
        checkInExperience: Math.round(stat.checkInExperience * 10) / 10,
        overallExperience: Math.round(stat.overallExperience * 10) / 10,
        ratingDistribution: {
            1: stat.rating1,
            2: stat.rating2,
            3: stat.rating3,
            4: stat.rating4,
            5: stat.rating5,
        },
    };
};

// Get host rating statistics
const getHostRatingStatsService = async (hostId: string): Promise<PropertyRatingStats> => {
    const stats = await RatingModel.aggregate([
        {
            $match: {
                hostId: new mongoose.Types.ObjectId(hostId),
                type: RatingType.PROPERTY,
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$overallExperience" },
                totalRatings: { $sum: 1 },
                communication: { $avg: "$communication" },
                accuracy: { $avg: "$accuracy" },
                cleanliness: { $avg: "$cleanliness" },
                checkInExperience: { $avg: "$checkInExperience" },
                overallExperience: { $avg: "$overallExperience" },
                rating1: { $sum: { $cond: [{ $eq: ["$overallExperience", 1] }, 1, 0] } },
                rating2: { $sum: { $cond: [{ $eq: ["$overallExperience", 2] }, 1, 0] } },
                rating3: { $sum: { $cond: [{ $eq: ["$overallExperience", 3] }, 1, 0] } },
                rating4: { $sum: { $cond: [{ $eq: ["$overallExperience", 4] }, 1, 0] } },
                rating5: { $sum: { $cond: [{ $eq: ["$overallExperience", 5] }, 1, 0] } },
            },
        },
    ]);

    if (stats.length === 0) {
        return {
            averageRating: 0,
            totalRatings: 0,
            communication: 0,
            accuracy: 0,
            cleanliness: 0,
            checkInExperience: 0,
            overallExperience: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }

    const stat = stats[0];
    return {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalRatings: stat.totalRatings,
        communication: Math.round(stat.communication * 10) / 10,
        accuracy: Math.round(stat.accuracy * 10) / 10,
        cleanliness: Math.round(stat.cleanliness * 10) / 10,
        checkInExperience: Math.round(stat.checkInExperience * 10) / 10,
        overallExperience: Math.round(stat.overallExperience * 10) / 10,
        ratingDistribution: {
            1: stat.rating1,
            2: stat.rating2,
            3: stat.rating3,
            4: stat.rating4,
            5: stat.rating5,
        },
    };
};

// Get all site ratings
const getSiteRatingsService = async (
    page: number = 1,
    limit: number = 10
): Promise<{
    ratings: IRating[];
    total: number;
}> => {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
        RatingModel.find({
            type: RatingType.SITE,
        })
            .populate("userId", userPopulationFields)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        RatingModel.countDocuments({
            type: RatingType.SITE,
        }),
    ]);

    return {
        ratings,
        total,
    };
};

// Get site rating statistics
const getSiteRatingStatsService = async (): Promise<SiteRatingStats> => {
    const stats = await RatingModel.aggregate([
        {
            $match: {
                type: RatingType.SITE,
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$overallExperience" },
                totalRatings: { $sum: 1 },
                rating1: { $sum: { $cond: [{ $eq: ["$overallExperience", 1] }, 1, 0] } },
                rating2: { $sum: { $cond: [{ $eq: ["$overallExperience", 2] }, 1, 0] } },
                rating3: { $sum: { $cond: [{ $eq: ["$overallExperience", 3] }, 1, 0] } },
                rating4: { $sum: { $cond: [{ $eq: ["$overallExperience", 4] }, 1, 0] } },
                rating5: { $sum: { $cond: [{ $eq: ["$overallExperience", 5] }, 1, 0] } },
            },
        },
    ]);

    const countryStats = await RatingModel.aggregate([
        {
            $match: {
                type: RatingType.SITE,
            },
        },
        {
            $group: {
                _id: "$country",
                count: { $sum: 1 },
                average: { $avg: "$overallExperience" },
            },
        },
        {
            $project: {
                country: "$_id",
                count: 1,
                average: { $round: ["$average", 1] },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);

    if (stats.length === 0) {
        return {
            averageRating: 0,
            totalRatings: 0,
            countryStats: [],
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }

    const stat = stats[0];
    return {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalRatings: stat.totalRatings,
        countryStats,
        ratingDistribution: {
            1: stat.rating1,
            2: stat.rating2,
            3: stat.rating3,
            4: stat.rating4,
            5: stat.rating5,
        },
    };
};

// Get user's rating for a specific property
const getUserPropertyRatingService = async (userId: string, propertyId: string): Promise<IRating | null> => {
    const rating = await RatingModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        propertyId: new mongoose.Types.ObjectId(propertyId),
        type: RatingType.PROPERTY,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields);

    return rating;
};

// Get user's site rating
const getUserSiteRatingService = async (userId: string): Promise<IRating | null> => {
    const rating = await RatingModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        type: RatingType.SITE,
    }).populate("userId", userPopulationFields);

    return rating;
};

// Get user's ratings for host properties
const getUserHostRatingsService = async (userId: string, hostId: string): Promise<IRating[]> => {
    const ratings = await RatingModel.find({
        userId: new mongoose.Types.ObjectId(userId),
        hostId: new mongoose.Types.ObjectId(hostId),
        type: RatingType.PROPERTY,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields)
        .sort({ createdAt: -1 });

    return ratings;
};

// Update a rating
const updateRatingService = async (ratingId: string, updateData: Partial<IRating>): Promise<IRating | null> => {
    const rating = await RatingModel.findByIdAndUpdate(ratingId, updateData, {
        new: true,
        runValidators: true,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields);

    return rating;
};

// Delete a rating
const deleteRatingService = async (ratingId: string): Promise<IRating | null> => {
    const rating = await RatingModel.findByIdAndDelete(ratingId).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields);

    return rating;
};

export const ratingServices = {
    createRatingService,
    getPropertyRatingsService,
    getHostRatingsService, // New service
    getPropertyRatingStatsService,
    getHostRatingStatsService, // New service
    getSiteRatingsService,
    getSiteRatingStatsService,
    getUserPropertyRatingService,
    getUserSiteRatingService,
    getUserHostRatingsService, // New service
    updateRatingService,
    deleteRatingService,
};
