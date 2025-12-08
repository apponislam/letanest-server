// import httpStatus from "http-status";
// import mongoose from "mongoose";
// import { IRating, RatingType, RatingStatus } from "./rating.interface";
// import ApiError from "../../../errors/ApiError";
// import { RatingModel } from "./rating.model";

// interface CreateRatingData {
//     type: RatingType;
//     userId: mongoose.Types.ObjectId;
//     propertyId?: mongoose.Types.ObjectId;
//     hostId?: mongoose.Types.ObjectId;
//     communication?: number;
//     accuracy?: number;
//     cleanliness?: number;
//     checkInExperience?: number;
//     overallExperience: number;
//     country?: string;
//     description?: string;
// }

// interface PropertyRatingStats {
//     averageRating: number;
//     totalRatings: number;
//     communication: number;
//     accuracy: number;
//     cleanliness: number;
//     checkInExperience: number;
//     overallExperience: number;
//     ratingDistribution: {
//         1: number;
//         2: number;
//         3: number;
//         4: number;
//         5: number;
//     };
// }

// interface SiteRatingStats {
//     averageRating: number;
//     totalRatings: number;
//     countryStats: { country: string; count: number; average: number }[];
//     ratingDistribution: {
//         1: number;
//         2: number;
//         3: number;
//         4: number;
//         5: number;
//     };
// }

// const userPopulationFields = "name email phone profileImg role";
// const propertyPopulationFields = "title description location propertyType maxGuests bedrooms bathrooms price coverPhoto photos status";

// // Create a new rating
// const createRatingService = async (ratingData: CreateRatingData): Promise<IRating> => {
//     if (ratingData.type === RatingType.PROPERTY) {
//         if (!ratingData.propertyId) {
//             throw new ApiError(httpStatus.BAD_REQUEST, "Property ID is required for property ratings");
//         }
//         if (!ratingData.hostId) {
//             throw new ApiError(httpStatus.BAD_REQUEST, "Host ID is required for property ratings");
//         }

//         const requiredFields = ["communication", "accuracy", "cleanliness", "checkInExperience"];
//         for (const field of requiredFields) {
//             if (!(field in ratingData)) {
//                 throw new ApiError(httpStatus.BAD_REQUEST, `${field} is required for property ratings`);
//             }
//         }

//         const existingRating = await RatingModel.findOne({
//             userId: ratingData.userId,
//             propertyId: ratingData.propertyId,
//             type: RatingType.PROPERTY,
//         });

//         if (existingRating) {
//             throw new ApiError(httpStatus.BAD_REQUEST, "You have already rated this property");
//         }
//     }

//     if (ratingData.type === RatingType.SITE && !ratingData.country) {
//         throw new ApiError(httpStatus.BAD_REQUEST, "Country is required for site ratings");
//     }

//     if (ratingData.type === RatingType.SITE) {
//         const existingRating = await RatingModel.findOne({
//             userId: ratingData.userId,
//             type: RatingType.SITE,
//         });

//         if (existingRating) {
//             throw new ApiError(httpStatus.BAD_REQUEST, "You have already rated the site");
//         }
//     }

//     const rating = await RatingModel.create(ratingData);
//     const populatedRating = await RatingModel.findById(rating._id).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields);

//     return populatedRating as IRating;
// };

// // Get all ratings for a specific property (only approved)
// const getPropertyRatingsService = async (propertyId: string, page: number = 1, limit: number = 10): Promise<{ ratings: IRating[]; total: number }> => {
//     const skip = (page - 1) * limit;

//     const [ratings, total] = await Promise.all([
//         RatingModel.find({
//             propertyId: new mongoose.Types.ObjectId(propertyId),
//             type: RatingType.PROPERTY,
//             status: RatingStatus.APPROVED,
//             isDeleted: false,
//         })
//             .populate("userId", userPopulationFields)
//             .populate("propertyId", propertyPopulationFields)
//             .populate("hostId", userPopulationFields)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit),
//         RatingModel.countDocuments({
//             propertyId: new mongoose.Types.ObjectId(propertyId),
//             type: RatingType.PROPERTY,
//             status: RatingStatus.APPROVED,
//             isDeleted: false,
//         }),
//     ]);

//     return { ratings, total };
// };

// // Get all ratings for a specific host (only approved)
// const getHostRatingsService = async (hostId: string): Promise<IRating[]> => {
//     const ratings = await RatingModel.find({
//         hostId: new mongoose.Types.ObjectId(hostId),
//         type: RatingType.PROPERTY,
//         status: RatingStatus.APPROVED,
//         isDeleted: false,
//     })
//         .populate("userId", userPopulationFields)
//         .populate("propertyId", propertyPopulationFields)
//         .populate("hostId", userPopulationFields)
//         .sort({ createdAt: -1 });

//     return ratings;
// };

// // Get property rating statistics (only approved)
// const getPropertyRatingStatsService = async (propertyId: string): Promise<PropertyRatingStats> => {
//     const stats = await RatingModel.aggregate([
//         {
//             $match: {
//                 propertyId: new mongoose.Types.ObjectId(propertyId),
//                 type: RatingType.PROPERTY,
//                 status: RatingStatus.APPROVED,
//                 isDeleted: false,
//             },
//         },
//         {
//             $group: {
//                 _id: null,
//                 averageRating: { $avg: "$overallExperience" },
//                 totalRatings: { $sum: 1 },
//                 communication: { $avg: "$communication" },
//                 accuracy: { $avg: "$accuracy" },
//                 cleanliness: { $avg: "$cleanliness" },
//                 checkInExperience: { $avg: "$checkInExperience" },
//                 overallExperience: { $avg: "$overallExperience" },
//                 rating1: { $sum: { $cond: [{ $eq: ["$overallExperience", 1] }, 1, 0] } },
//                 rating2: { $sum: { $cond: [{ $eq: ["$overallExperience", 2] }, 1, 0] } },
//                 rating3: { $sum: { $cond: [{ $eq: ["$overallExperience", 3] }, 1, 0] } },
//                 rating4: { $sum: { $cond: [{ $eq: ["$overallExperience", 4] }, 1, 0] } },
//                 rating5: { $sum: { $cond: [{ $eq: ["$overallExperience", 5] }, 1, 0] } },
//             },
//         },
//     ]);

//     if (stats.length === 0) {
//         return {
//             averageRating: 0,
//             totalRatings: 0,
//             communication: 0,
//             accuracy: 0,
//             cleanliness: 0,
//             checkInExperience: 0,
//             overallExperience: 0,
//             ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
//         };
//     }

//     const stat = stats[0];
//     return {
//         averageRating: Math.round(stat.averageRating * 10) / 10,
//         totalRatings: stat.totalRatings,
//         communication: Math.round(stat.communication * 10) / 10,
//         accuracy: Math.round(stat.accuracy * 10) / 10,
//         cleanliness: Math.round(stat.cleanliness * 10) / 10,
//         checkInExperience: Math.round(stat.checkInExperience * 10) / 10,
//         overallExperience: Math.round(stat.overallExperience * 10) / 10,
//         ratingDistribution: {
//             1: stat.rating1,
//             2: stat.rating2,
//             3: stat.rating3,
//             4: stat.rating4,
//             5: stat.rating5,
//         },
//     };
// };

// // Get host rating statistics (only approved)
// const getHostRatingStatsService = async (hostId: string): Promise<PropertyRatingStats> => {
//     const stats = await RatingModel.aggregate([
//         {
//             $match: {
//                 hostId: new mongoose.Types.ObjectId(hostId),
//                 type: RatingType.PROPERTY,
//                 status: RatingStatus.APPROVED,
//                 isDeleted: false,
//             },
//         },
//         {
//             $group: {
//                 _id: null,
//                 averageRating: { $avg: "$overallExperience" },
//                 totalRatings: { $sum: 1 },
//                 communication: { $avg: "$communication" },
//                 accuracy: { $avg: "$accuracy" },
//                 cleanliness: { $avg: "$cleanliness" },
//                 checkInExperience: { $avg: "$checkInExperience" },
//                 overallExperience: { $avg: "$overallExperience" },
//                 rating1: { $sum: { $cond: [{ $eq: ["$overallExperience", 1] }, 1, 0] } },
//                 rating2: { $sum: { $cond: [{ $eq: ["$overallExperience", 2] }, 1, 0] } },
//                 rating3: { $sum: { $cond: [{ $eq: ["$overallExperience", 3] }, 1, 0] } },
//                 rating4: { $sum: { $cond: [{ $eq: ["$overallExperience", 4] }, 1, 0] } },
//                 rating5: { $sum: { $cond: [{ $eq: ["$overallExperience", 5] }, 1, 0] } },
//             },
//         },
//     ]);

//     if (stats.length === 0) {
//         return {
//             averageRating: 0,
//             totalRatings: 0,
//             communication: 0,
//             accuracy: 0,
//             cleanliness: 0,
//             checkInExperience: 0,
//             overallExperience: 0,
//             ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
//         };
//     }

//     const stat = stats[0];
//     return {
//         averageRating: Math.round(stat.averageRating * 10) / 10,
//         totalRatings: stat.totalRatings,
//         communication: Math.round(stat.communication * 10) / 10,
//         accuracy: Math.round(stat.accuracy * 10) / 10,
//         cleanliness: Math.round(stat.cleanliness * 10) / 10,
//         checkInExperience: Math.round(stat.checkInExperience * 10) / 10,
//         overallExperience: Math.round(stat.overallExperience * 10) / 10,
//         ratingDistribution: {
//             1: stat.rating1,
//             2: stat.rating2,
//             3: stat.rating3,
//             4: stat.rating4,
//             5: stat.rating5,
//         },
//     };
// };

// // Get all site ratings (only approved)
// const getSiteRatingsService = async (
//     page: number = 1,
//     limit: number = 10
// ): Promise<{
//     ratings: IRating[];
//     total: number;
// }> => {
//     const skip = (page - 1) * limit;

//     const [ratings, total] = await Promise.all([
//         RatingModel.find({
//             type: RatingType.SITE,
//             status: RatingStatus.APPROVED,
//             isDeleted: false,
//         })
//             .populate("userId", userPopulationFields)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit),
//         RatingModel.countDocuments({
//             type: RatingType.SITE,
//             status: RatingStatus.APPROVED,
//             isDeleted: false,
//         }),
//     ]);

//     return { ratings, total };
// };

// // Get site rating statistics (only approved)
// const getSiteRatingStatsService = async (): Promise<SiteRatingStats> => {
//     const stats = await RatingModel.aggregate([
//         {
//             $match: {
//                 type: RatingType.SITE,
//                 status: RatingStatus.APPROVED,
//                 isDeleted: false,
//             },
//         },
//         {
//             $group: {
//                 _id: null,
//                 averageRating: { $avg: "$overallExperience" },
//                 totalRatings: { $sum: 1 },
//                 rating1: { $sum: { $cond: [{ $eq: ["$overallExperience", 1] }, 1, 0] } },
//                 rating2: { $sum: { $cond: [{ $eq: ["$overallExperience", 2] }, 1, 0] } },
//                 rating3: { $sum: { $cond: [{ $eq: ["$overallExperience", 3] }, 1, 0] } },
//                 rating4: { $sum: { $cond: [{ $eq: ["$overallExperience", 4] }, 1, 0] } },
//                 rating5: { $sum: { $cond: [{ $eq: ["$overallExperience", 5] }, 1, 0] } },
//             },
//         },
//     ]);

//     const countryStats = await RatingModel.aggregate([
//         {
//             $match: {
//                 type: RatingType.SITE,
//                 status: RatingStatus.APPROVED,
//                 isDeleted: false,
//             },
//         },
//         {
//             $group: {
//                 _id: "$country",
//                 count: { $sum: 1 },
//                 average: { $avg: "$overallExperience" },
//             },
//         },
//         {
//             $project: {
//                 country: "$_id",
//                 count: 1,
//                 average: { $round: ["$average", 1] },
//             },
//         },
//         {
//             $sort: { count: -1 },
//         },
//     ]);

//     if (stats.length === 0) {
//         return {
//             averageRating: 0,
//             totalRatings: 0,
//             countryStats: [],
//             ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
//         };
//     }

//     const stat = stats[0];
//     return {
//         averageRating: Math.round(stat.averageRating * 10) / 10,
//         totalRatings: stat.totalRatings,
//         countryStats,
//         ratingDistribution: {
//             1: stat.rating1,
//             2: stat.rating2,
//             3: stat.rating3,
//             4: stat.rating4,
//             5: stat.rating5,
//         },
//     };
// };

// // Get user's rating for a specific property
// const getUserPropertyRatingService = async (userId: string, propertyId: string): Promise<IRating | null> => {
//     const rating = await RatingModel.findOne({
//         userId: new mongoose.Types.ObjectId(userId),
//         propertyId: new mongoose.Types.ObjectId(propertyId),
//         type: RatingType.PROPERTY,
//         isDeleted: false,
//     })
//         .populate("userId", userPopulationFields)
//         .populate("propertyId", propertyPopulationFields)
//         .populate("hostId", userPopulationFields);

//     return rating;
// };

// // Get user's site rating
// const getUserSiteRatingService = async (userId: string): Promise<IRating | null> => {
//     const rating = await RatingModel.findOne({
//         userId: new mongoose.Types.ObjectId(userId),
//         type: RatingType.SITE,
//         isDeleted: false,
//     }).populate("userId", userPopulationFields);

//     return rating;
// };

// // Get user's ratings for host properties
// const getUserHostRatingsService = async (userId: string, hostId: string): Promise<IRating[]> => {
//     const ratings = await RatingModel.find({
//         userId: new mongoose.Types.ObjectId(userId),
//         hostId: new mongoose.Types.ObjectId(hostId),
//         type: RatingType.PROPERTY,
//         isDeleted: false,
//     })
//         .populate("userId", userPopulationFields)
//         .populate("propertyId", propertyPopulationFields)
//         .populate("hostId", userPopulationFields)
//         .sort({ createdAt: -1 });

//     return ratings;
// };

// // Update a rating
// const updateRatingService = async (ratingId: string, updateData: Partial<IRating>): Promise<IRating | null> => {
//     const rating = await RatingModel.findByIdAndUpdate(ratingId, updateData, {
//         new: true,
//         runValidators: true,
//     })
//         .populate("userId", userPopulationFields)
//         .populate("propertyId", propertyPopulationFields)
//         .populate("hostId", userPopulationFields);

//     return rating;
// };

// // Delete a rating (soft delete)
// const deleteRatingService = async (ratingId: string): Promise<IRating | null> => {
//     const rating = await RatingModel.findByIdAndUpdate(ratingId, { isDeleted: true }, { new: true }).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields);

//     return rating;
// };

// // Get all ratings for admin with filters (includes all statuses)
// interface GetAllRatingsFilter {
//     type?: RatingType;
//     status?: RatingStatus;
//     page?: number;
//     limit?: number;
//     sortBy?: string;
//     sortOrder?: "asc" | "desc";
//     search?: string;
// }

// const getAllRatingsForAdminService = async (
//     filters: GetAllRatingsFilter
// ): Promise<{
//     ratings: IRating[];
//     total: number;
//     page: number;
//     limit: number;
// }> => {
//     const { type, status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search } = filters;

//     const skip = (page - 1) * limit;

//     const filterQuery: any = { isDeleted: false };

//     if (type) filterQuery.type = type;
//     if (status) filterQuery.status = status;

//     if (search) {
//         const userSearchQuery = await RatingModel.find({
//             $or: [{ "userId.name": { $regex: search, $options: "i" } }, { "userId.email": { $regex: search, $options: "i" } }],
//         }).distinct("_id");

//         const propertySearchQuery = await RatingModel.find({
//             "propertyId.title": { $regex: search, $options: "i" },
//         }).distinct("_id");

//         filterQuery.$or = [{ _id: { $in: userSearchQuery } }, { _id: { $in: propertySearchQuery } }, { country: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
//     }

//     const sortConfig: any = {};
//     sortConfig[sortBy] = sortOrder === "desc" ? -1 : 1;

//     const [ratings, total] = await Promise.all([RatingModel.find(filterQuery).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields).sort(sortConfig).skip(skip).limit(limit), RatingModel.countDocuments(filterQuery)]);

//     return { ratings, total, page, limit };
// };

// // Get rating statistics for admin dashboard
// const getAdminRatingStatsService = async (): Promise<{
//     totalRatings: number;
//     siteRatings: number;
//     propertyRatings: number;
//     pendingSiteRatings: number;
//     pendingPropertyRatings: number;
//     averageSiteRating: number;
//     averagePropertyRating: number;
//     recentRatings: IRating[];
// }> => {
//     const [totalRatings, siteRatings, propertyRatings, pendingSiteRatings, pendingPropertyRatings, siteStats, propertyStats, recentRatings] = await Promise.all([
//         RatingModel.countDocuments({ isDeleted: false }),
//         RatingModel.countDocuments({ type: RatingType.SITE, isDeleted: false }),
//         RatingModel.countDocuments({ type: RatingType.PROPERTY, isDeleted: false }),
//         RatingModel.countDocuments({ type: RatingType.SITE, status: RatingStatus.PENDING, isDeleted: false }),
//         RatingModel.countDocuments({ type: RatingType.PROPERTY, status: RatingStatus.PENDING, isDeleted: false }),
//         RatingModel.aggregate([{ $match: { type: RatingType.SITE, isDeleted: false } }, { $group: { _id: null, average: { $avg: "$overallExperience" } } }]),
//         RatingModel.aggregate([{ $match: { type: RatingType.PROPERTY, isDeleted: false } }, { $group: { _id: null, average: { $avg: "$overallExperience" } } }]),
//         RatingModel.find({ isDeleted: false }).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields).sort({ createdAt: -1 }).limit(10),
//     ]);

//     return {
//         totalRatings,
//         siteRatings,
//         propertyRatings,
//         pendingSiteRatings,
//         pendingPropertyRatings,
//         averageSiteRating: siteStats.length > 0 ? Math.round(siteStats[0].average * 10) / 10 : 0,
//         averagePropertyRating: propertyStats.length > 0 ? Math.round(propertyStats[0].average * 10) / 10 : 0,
//         recentRatings,
//     };
// };

// // Check user properties rating service
// const checkUserPropertiesRatingService = async (userId: string, propertyIds: string[]): Promise<{ propertyId: string; hasRated: boolean }[]> => {
//     const validPropertyIds = propertyIds.filter((id) => id && mongoose.Types.ObjectId.isValid(id));

//     if (validPropertyIds.length === 0) {
//         return [];
//     }

//     const ratings = await RatingModel.find({
//         type: RatingType.PROPERTY,
//         userId: new mongoose.Types.ObjectId(userId),
//         propertyId: { $in: validPropertyIds.map((id) => new mongoose.Types.ObjectId(id)) },
//         isDeleted: false,
//     });

//     const ratingMap = new Map();
//     ratings.forEach((rating) => {
//         if (rating.propertyId) {
//             ratingMap.set(rating.propertyId.toString(), true);
//         }
//     });

//     return validPropertyIds.map((propertyId) => ({
//         propertyId,
//         hasRated: ratingMap.has(propertyId),
//     }));
// };

// // Update rating status (for admin)
// const updateRatingStatusService = async (ratingId: string, status: RatingStatus): Promise<IRating | null> => {
//     const rating = await RatingModel.findByIdAndUpdate(ratingId, { status }, { new: true, runValidators: true }).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("hostId", userPopulationFields);

//     return rating;
// };

// export const ratingServices = {
//     createRatingService,
//     getPropertyRatingsService,
//     getHostRatingsService,
//     getPropertyRatingStatsService,
//     getHostRatingStatsService,
//     getSiteRatingsService,
//     getSiteRatingStatsService,
//     getUserPropertyRatingService,
//     getUserSiteRatingService,
//     getUserHostRatingsService,
//     updateRatingService,
//     deleteRatingService,
//     getAllRatingsForAdminService,
//     getAdminRatingStatsService,
//     checkUserPropertiesRatingService,
//     updateRatingStatusService,
// };

import httpStatus from "http-status";
import mongoose from "mongoose";
import { IRating, RatingType, RatingStatus } from "./rating.interface";
import ApiError from "../../../errors/ApiError";
import { RatingModel } from "./rating.model";
import { messageServices } from "../messages/message.services";

interface CreateRatingData {
    type: RatingType;
    userId: mongoose.Types.ObjectId;
    propertyId?: mongoose.Types.ObjectId;
    reviewedId?: mongoose.Types.ObjectId;
    communication?: number;
    accuracy?: number;
    cleanliness?: number;
    checkInExperience?: number;
    overallExperience: number;
    country?: string;
    description?: string;
    message?: string;
}

interface RatingStats {
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

const userPopulationFields = "name email phone profileImg role";
const propertyPopulationFields = "title description location propertyType maxGuests bedrooms bathrooms price coverPhoto photos status";

// Create a new rating
const createRatingService = async (ratingData: CreateRatingData): Promise<IRating> => {
    if (ratingData.type === RatingType.PROPERTY) {
        if (!ratingData.propertyId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Property ID is required for property ratings");
        }
        if (!ratingData.reviewedId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Reviewed ID is required for property ratings");
        }
    }

    if (ratingData.type === RatingType.GUEST) {
        if (!ratingData.reviewedId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Reviewed ID is required for guest ratings");
        }
    }

    // Common required fields for both property and guest ratings
    if (ratingData.type === RatingType.PROPERTY || ratingData.type === RatingType.GUEST) {
        const requiredFields = ["communication", "accuracy", "cleanliness", "checkInExperience"];
        for (const field of requiredFields) {
            if (!(field in ratingData)) {
                throw new ApiError(httpStatus.BAD_REQUEST, `${field} is required for ${ratingData.type} ratings`);
            }
        }
    }

    if (ratingData.type === RatingType.SITE && !ratingData.country) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Country is required for site ratings");
    }

    // Check existing ratings - ONLY FOR SITE RATINGS
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
    const populatedRating = await RatingModel.findById(rating._id).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("reviewedId", userPopulationFields);
    if (ratingData?.message) {
        messageServices.reviewDone(ratingData.message).catch((err) => {
            console.error("Failed to update message review status:", err);
        });
    }

    return populatedRating as IRating;
};

// Get all ratings for a specific property (only approved)
const getPropertyRatingsService = async (propertyId: string, page: number = 1, limit: number = 10): Promise<{ ratings: IRating[]; total: number }> => {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
        RatingModel.find({
            propertyId: new mongoose.Types.ObjectId(propertyId),
            type: RatingType.PROPERTY,
            status: RatingStatus.APPROVED,
            isDeleted: false,
        })
            .populate("userId", userPopulationFields)
            .populate("propertyId", propertyPopulationFields)
            .populate("reviewedId", userPopulationFields)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        RatingModel.countDocuments({
            propertyId: new mongoose.Types.ObjectId(propertyId),
            type: RatingType.PROPERTY,
            status: RatingStatus.APPROVED,
            isDeleted: false,
        }),
    ]);

    return { ratings, total };
};

// Get all ratings for a specific reviewed user (BOTH host and guest ratings)
const getUserRatingsService = async (reviewedId: string, page: number = 1, limit: number = 10): Promise<{ ratings: IRating[]; total: number }> => {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
        RatingModel.find({
            reviewedId: new mongoose.Types.ObjectId(reviewedId),
            status: RatingStatus.APPROVED,
            isDeleted: false,
        })
            .populate("userId", userPopulationFields)
            .populate("propertyId", propertyPopulationFields)
            .populate("reviewedId", userPopulationFields)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        RatingModel.countDocuments({
            reviewedId: new mongoose.Types.ObjectId(reviewedId),
            status: RatingStatus.APPROVED,
            isDeleted: false,
        }),
    ]);

    return { ratings, total };
};

// Get property rating statistics (only approved)
const getPropertyRatingStatsService = async (propertyId: string): Promise<RatingStats> => {
    const stats = await RatingModel.aggregate([
        {
            $match: {
                propertyId: new mongoose.Types.ObjectId(propertyId),
                type: RatingType.PROPERTY,
                status: RatingStatus.APPROVED,
                isDeleted: false,
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

// Get user rating statistics (BOTH host and guest ratings)
const getUserRatingStatsService = async (reviewedId: string): Promise<RatingStats> => {
    const stats = await RatingModel.aggregate([
        {
            $match: {
                reviewedId: new mongoose.Types.ObjectId(reviewedId),
                status: RatingStatus.APPROVED,
                isDeleted: false,
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

// Get all site ratings (only approved)
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
            status: RatingStatus.APPROVED,
            isDeleted: false,
        })
            .populate("userId", userPopulationFields)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        RatingModel.countDocuments({
            type: RatingType.SITE,
            status: RatingStatus.APPROVED,
            isDeleted: false,
        }),
    ]);

    return { ratings, total };
};

// Get site rating statistics (only approved)
const getSiteRatingStatsService = async (): Promise<SiteRatingStats> => {
    const stats = await RatingModel.aggregate([
        {
            $match: {
                type: RatingType.SITE,
                status: RatingStatus.APPROVED,
                isDeleted: false,
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
                status: RatingStatus.APPROVED,
                isDeleted: false,
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
        isDeleted: false,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("reviewedId", userPopulationFields);

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

// Get user's ratings for reviewed user (BOTH host and guest ratings)
const getUserRatingsForReviewedService = async (userId: string, reviewedId: string): Promise<IRating[]> => {
    const ratings = await RatingModel.find({
        userId: new mongoose.Types.ObjectId(userId),
        reviewedId: new mongoose.Types.ObjectId(reviewedId),
        isDeleted: false,
    })
        .populate("userId", userPopulationFields)
        .populate("propertyId", propertyPopulationFields)
        .populate("reviewedId", userPopulationFields)
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
        .populate("reviewedId", userPopulationFields);

    return rating;
};

// Delete a rating (soft delete)
const deleteRatingService = async (ratingId: string): Promise<IRating | null> => {
    const rating = await RatingModel.findByIdAndUpdate(ratingId, { isDeleted: true }, { new: true }).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("reviewedId", userPopulationFields);

    return rating;
};

// Get all ratings for admin with filters (includes all statuses)
interface GetAllRatingsFilter {
    type?: RatingType;
    status?: RatingStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
}

const getAllRatingsForAdminService = async (
    filters: GetAllRatingsFilter
): Promise<{
    ratings: IRating[];
    total: number;
    page: number;
    limit: number;
}> => {
    const { type, status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search } = filters;

    const skip = (page - 1) * limit;

    const filterQuery: any = { isDeleted: false };

    if (type) filterQuery.type = type;
    if (status) filterQuery.status = status;

    if (search) {
        const userSearchQuery = await RatingModel.find({
            $or: [{ "userId.name": { $regex: search, $options: "i" } }, { "userId.email": { $regex: search, $options: "i" } }, { "reviewedId.name": { $regex: search, $options: "i" } }, { "reviewedId.email": { $regex: search, $options: "i" } }],
        }).distinct("_id");

        const propertySearchQuery = await RatingModel.find({
            "propertyId.title": { $regex: search, $options: "i" },
        }).distinct("_id");

        filterQuery.$or = [{ _id: { $in: userSearchQuery } }, { _id: { $in: propertySearchQuery } }, { country: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
    }

    const sortConfig: any = {};
    sortConfig[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [ratings, total] = await Promise.all([RatingModel.find(filterQuery).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("reviewedId", userPopulationFields).sort(sortConfig).skip(skip).limit(limit), RatingModel.countDocuments(filterQuery)]);

    return { ratings, total, page, limit };
};

// Get rating statistics for admin dashboard
const getAdminRatingStatsService = async (): Promise<{
    totalRatings: number;
    siteRatings: number;
    propertyRatings: number;
    guestRatings: number;
    pendingSiteRatings: number;
    pendingPropertyRatings: number;
    pendingGuestRatings: number;
    averageSiteRating: number;
    averagePropertyRating: number;
    averageGuestRating: number;
    recentRatings: IRating[];
}> => {
    const [totalRatings, siteRatings, propertyRatings, guestRatings, pendingSiteRatings, pendingPropertyRatings, pendingGuestRatings, siteStats, propertyStats, guestStats, recentRatings] = await Promise.all([
        RatingModel.countDocuments({ isDeleted: false }),
        RatingModel.countDocuments({ type: RatingType.SITE, isDeleted: false }),
        RatingModel.countDocuments({ type: RatingType.PROPERTY, isDeleted: false }),
        RatingModel.countDocuments({ type: RatingType.GUEST, isDeleted: false }),
        RatingModel.countDocuments({ type: RatingType.SITE, status: RatingStatus.PENDING, isDeleted: false }),
        RatingModel.countDocuments({ type: RatingType.PROPERTY, status: RatingStatus.PENDING, isDeleted: false }),
        RatingModel.countDocuments({ type: RatingType.GUEST, status: RatingStatus.PENDING, isDeleted: false }),
        RatingModel.aggregate([{ $match: { type: RatingType.SITE, isDeleted: false } }, { $group: { _id: null, average: { $avg: "$overallExperience" } } }]),
        RatingModel.aggregate([{ $match: { type: RatingType.PROPERTY, isDeleted: false } }, { $group: { _id: null, average: { $avg: "$overallExperience" } } }]),
        RatingModel.aggregate([{ $match: { type: RatingType.GUEST, isDeleted: false } }, { $group: { _id: null, average: { $avg: "$overallExperience" } } }]),
        RatingModel.find({ isDeleted: false }).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("reviewedId", userPopulationFields).sort({ createdAt: -1 }).limit(10),
    ]);

    return {
        totalRatings,
        siteRatings,
        propertyRatings,
        guestRatings,
        pendingSiteRatings,
        pendingPropertyRatings,
        pendingGuestRatings,
        averageSiteRating: siteStats.length > 0 ? Math.round(siteStats[0].average * 10) / 10 : 0,
        averagePropertyRating: propertyStats.length > 0 ? Math.round(propertyStats[0].average * 10) / 10 : 0,
        averageGuestRating: guestStats.length > 0 ? Math.round(guestStats[0].average * 10) / 10 : 0,
        recentRatings,
    };
};

// Check user properties rating service
const checkUserPropertiesRatingService = async (userId: string, propertyIds: string[]): Promise<{ propertyId: string; hasRated: boolean }[]> => {
    const validPropertyIds = propertyIds.filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    if (validPropertyIds.length === 0) {
        return [];
    }

    const ratings = await RatingModel.find({
        type: RatingType.PROPERTY,
        userId: new mongoose.Types.ObjectId(userId),
        propertyId: { $in: validPropertyIds.map((id) => new mongoose.Types.ObjectId(id)) },
        isDeleted: false,
    });

    const ratingMap = new Map();
    ratings.forEach((rating) => {
        if (rating.propertyId) {
            ratingMap.set(rating.propertyId.toString(), true);
        }
    });

    return validPropertyIds.map((propertyId) => ({
        propertyId,
        hasRated: ratingMap.has(propertyId),
    }));
};

// Update rating status (for admin)
const updateRatingStatusService = async (ratingId: string, status: RatingStatus): Promise<IRating | null> => {
    const rating = await RatingModel.findByIdAndUpdate(ratingId, { status }, { new: true, runValidators: true }).populate("userId", userPopulationFields).populate("propertyId", propertyPopulationFields).populate("reviewedId", userPopulationFields);

    return rating;
};

export const ratingServices = {
    createRatingService,
    getPropertyRatingsService,
    getUserRatingsService,
    getPropertyRatingStatsService,
    getUserRatingStatsService,
    getSiteRatingsService,
    getSiteRatingStatsService,
    getUserPropertyRatingService,
    getUserSiteRatingService,
    getUserRatingsForReviewedService,
    updateRatingService,
    deleteRatingService,
    getAllRatingsForAdminService,
    getAdminRatingStatsService,
    checkUserPropertiesRatingService,
    updateRatingStatusService,
};
