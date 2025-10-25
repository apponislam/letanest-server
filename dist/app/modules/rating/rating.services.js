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
exports.ratingServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const rating_interface_1 = require("./rating.interface");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const rating_model_1 = require("./rating.model");
// User population fields
const userPopulationFields = "name email phone profileImg role";
// Property population fields
const propertyPopulationFields = "title description location propertyType maxGuests bedrooms bathrooms price coverPhoto photos status";
// Create a new rating
const createRatingService = (ratingData) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate propertyId and hostId are provided for property ratings
    if (ratingData.type === rating_interface_1.RatingType.PROPERTY) {
        if (!ratingData.propertyId) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Property ID is required for property ratings");
        }
        if (!ratingData.hostId) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Host ID is required for property ratings");
        }
        // Validate property-specific fields
        const requiredFields = ["communication", "accuracy", "cleanliness", "checkInExperience"];
        for (const field of requiredFields) {
            if (!(field in ratingData)) {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `${field} is required for property ratings`);
            }
        }
        // Check if user already rated this property
        const existingRating = yield rating_model_1.RatingModel.findOne({
            userId: ratingData.userId,
            propertyId: ratingData.propertyId,
            type: rating_interface_1.RatingType.PROPERTY,
        });
        if (existingRating) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "You have already rated this property");
        }
    }
    // Validate country is provided for site ratings
    if (ratingData.type === rating_interface_1.RatingType.SITE && !ratingData.country) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Country is required for site ratings");
    }
    // Check if user already rated the site (for site ratings)
    if (ratingData.type === rating_interface_1.RatingType.SITE) {
        const existingRating = yield rating_model_1.RatingModel.findOne({
            userId: ratingData.userId,
            type: rating_interface_1.RatingType.SITE,
        });
        if (existingRating) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "You have already rated the site");
        }
    }
    const rating = yield rating_model_1.RatingModel.create(ratingData);
    // Populate the created rating
    const populatedRating = yield rating_model_1.RatingModel.findById(rating._id).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields); // Populate host info
    return populatedRating;
});
// Get all ratings for a specific property
const getPropertyRatingsService = (propertyId_1, ...args_1) => __awaiter(void 0, [propertyId_1, ...args_1], void 0, function* (propertyId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [ratings, total] = yield Promise.all([
        rating_model_1.RatingModel.find({
            propertyId: new mongoose_1.default.Types.ObjectId(propertyId),
            type: rating_interface_1.RatingType.PROPERTY,
        })
            .populate("userId", userPopulationFields)
            .populate("propertyId", propertyPopulationFields)
            .populate("hostId", userPopulationFields)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        rating_model_1.RatingModel.countDocuments({
            propertyId: new mongoose_1.default.Types.ObjectId(propertyId),
            type: rating_interface_1.RatingType.PROPERTY,
        }),
    ]);
    return { ratings, total };
});
// Get all ratings for a specific host
const getHostRatingsService = (hostId) => __awaiter(void 0, void 0, void 0, function* () {
    const ratings = yield rating_model_1.RatingModel.find({
        hostId: new mongoose_1.default.Types.ObjectId(hostId),
        type: rating_interface_1.RatingType.PROPERTY,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields)
        .sort({ createdAt: -1 });
    return ratings;
});
// Get property rating statistics
const getPropertyRatingStatsService = (propertyId) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield rating_model_1.RatingModel.aggregate([
        {
            $match: {
                propertyId: new mongoose_1.default.Types.ObjectId(propertyId),
                type: rating_interface_1.RatingType.PROPERTY,
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
});
// Get host rating statistics
const getHostRatingStatsService = (hostId) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield rating_model_1.RatingModel.aggregate([
        {
            $match: {
                hostId: new mongoose_1.default.Types.ObjectId(hostId),
                type: rating_interface_1.RatingType.PROPERTY,
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
});
// Get all site ratings
const getSiteRatingsService = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [ratings, total] = yield Promise.all([
        rating_model_1.RatingModel.find({
            type: rating_interface_1.RatingType.SITE,
        })
            .populate("userId", userPopulationFields)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        rating_model_1.RatingModel.countDocuments({
            type: rating_interface_1.RatingType.SITE,
        }),
    ]);
    return {
        ratings,
        total,
    };
});
// Get site rating statistics
const getSiteRatingStatsService = () => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield rating_model_1.RatingModel.aggregate([
        {
            $match: {
                type: rating_interface_1.RatingType.SITE,
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
    const countryStats = yield rating_model_1.RatingModel.aggregate([
        {
            $match: {
                type: rating_interface_1.RatingType.SITE,
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
});
// Get user's rating for a specific property
const getUserPropertyRatingService = (userId, propertyId) => __awaiter(void 0, void 0, void 0, function* () {
    const rating = yield rating_model_1.RatingModel.findOne({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        propertyId: new mongoose_1.default.Types.ObjectId(propertyId),
        type: rating_interface_1.RatingType.PROPERTY,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields);
    return rating;
});
// Get user's site rating
const getUserSiteRatingService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const rating = yield rating_model_1.RatingModel.findOne({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        type: rating_interface_1.RatingType.SITE,
    }).populate("userId", userPopulationFields);
    return rating;
});
// Get user's ratings for host properties
const getUserHostRatingsService = (userId, hostId) => __awaiter(void 0, void 0, void 0, function* () {
    const ratings = yield rating_model_1.RatingModel.find({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        hostId: new mongoose_1.default.Types.ObjectId(hostId),
        type: rating_interface_1.RatingType.PROPERTY,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields)
        .sort({ createdAt: -1 });
    return ratings;
});
// Update a rating
const updateRatingService = (ratingId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const rating = yield rating_model_1.RatingModel.findByIdAndUpdate(ratingId, updateData, {
        new: true,
        runValidators: true,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("hostId", userPopulationFields);
    return rating;
});
// Delete a rating
const deleteRatingService = (ratingId) => __awaiter(void 0, void 0, void 0, function* () {
    const rating = yield rating_model_1.RatingModel.findByIdAndDelete(ratingId).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields);
    return rating;
});
const getAllRatingsForAdminService = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search } = filters;
    const skip = (page - 1) * limit;
    // Build filter query
    const filterQuery = {};
    if (type)
        filterQuery.type = type;
    // Search functionality
    if (search) {
        const userSearchQuery = yield rating_model_1.RatingModel.find({
            $or: [{ "userId.name": { $regex: search, $options: "i" } }, { "userId.email": { $regex: search, $options: "i" } }],
        }).distinct("_id");
        const propertySearchQuery = yield rating_model_1.RatingModel.find({
            "propertyId.title": { $regex: search, $options: "i" },
        }).distinct("_id");
        filterQuery.$or = [{ _id: { $in: userSearchQuery } }, { _id: { $in: propertySearchQuery } }, { country: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
    }
    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === "desc" ? -1 : 1;
    const [ratings, total] = yield Promise.all([rating_model_1.RatingModel.find(filterQuery).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields).sort(sortConfig).skip(skip).limit(limit), rating_model_1.RatingModel.countDocuments(filterQuery)]);
    return {
        ratings,
        total,
        page,
        limit,
    };
});
// Get rating statistics for admin dashboard
const getAdminRatingStatsService = () => __awaiter(void 0, void 0, void 0, function* () {
    const [totalRatings, siteRatings, propertyRatings, siteStats, propertyStats, recentRatings] = yield Promise.all([
        rating_model_1.RatingModel.countDocuments(),
        rating_model_1.RatingModel.countDocuments({ type: rating_interface_1.RatingType.SITE }),
        rating_model_1.RatingModel.countDocuments({ type: rating_interface_1.RatingType.PROPERTY }),
        // Average site rating
        rating_model_1.RatingModel.aggregate([{ $match: { type: rating_interface_1.RatingType.SITE } }, { $group: { _id: null, average: { $avg: "$overallExperience" } } }]),
        // Average property rating
        rating_model_1.RatingModel.aggregate([{ $match: { type: rating_interface_1.RatingType.PROPERTY } }, { $group: { _id: null, average: { $avg: "$overallExperience" } } }]),
        // Recent ratings (last 10)
        rating_model_1.RatingModel.find().populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields).sort({ createdAt: -1 }).limit(10),
    ]);
    return {
        totalRatings,
        siteRatings,
        propertyRatings,
        averageSiteRating: siteStats.length > 0 ? Math.round(siteStats[0].average * 10) / 10 : 0,
        averagePropertyRating: propertyStats.length > 0 ? Math.round(propertyStats[0].average * 10) / 10 : 0,
        recentRatings,
    };
});
const checkUserPropertiesRatingService = (userId, propertyIds) => __awaiter(void 0, void 0, void 0, function* () {
    // Filter out undefined/null propertyIds
    const validPropertyIds = propertyIds.filter((id) => id && mongoose_1.default.Types.ObjectId.isValid(id));
    if (validPropertyIds.length === 0) {
        return [];
    }
    const ratings = yield rating_model_1.RatingModel.find({
        type: rating_interface_1.RatingType.PROPERTY,
        userId: new mongoose_1.default.Types.ObjectId(userId),
        propertyId: { $in: validPropertyIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) },
    });
    // Create a map for quick lookup
    const ratingMap = new Map();
    ratings.forEach((rating) => {
        if (rating.propertyId) {
            ratingMap.set(rating.propertyId.toString(), true);
        }
    });
    // Return array with hasRated status for each property
    return validPropertyIds.map((propertyId) => ({
        propertyId,
        hasRated: ratingMap.has(propertyId),
    }));
});
exports.ratingServices = {
    createRatingService,
    getPropertyRatingsService,
    getHostRatingsService,
    getPropertyRatingStatsService,
    getHostRatingStatsService,
    getSiteRatingsService,
    getSiteRatingStatsService,
    getUserPropertyRatingService,
    getUserSiteRatingService,
    getUserHostRatingsService,
    updateRatingService,
    deleteRatingService,
    // new for admin
    getAllRatingsForAdminService,
    getAdminRatingStatsService,
    // check rated properties
    checkUserPropertiesRatingService,
};
