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
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyServices = void 0;
const properties_model_1 = require("./properties.model");
const mongoose_1 = require("mongoose");
const geocodingService_1 = require("./geocodingService");
const createPropertyService = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Parse data
        const parsedData = Object.assign(Object.assign({}, data), { maxGuests: Number(data.maxGuests), bedrooms: Number(data.bedrooms), bathrooms: Number(data.bathrooms), price: Number(data.price), availableFrom: new Date(data.availableFrom), availableTo: new Date(data.availableTo), amenities: Array.isArray(data.amenities) ? data.amenities : [] });
        // Get coordinates from geocoding
        if (parsedData.location && parsedData.postCode) {
            const geocodedData = yield (0, geocodingService_1.geocodeAddress)(parsedData.location, parsedData.postCode);
            if (geocodedData) {
                parsedData.coordinates = {
                    lat: geocodedData.lat,
                    lng: geocodedData.lng,
                };
                console.log(`Coordinates found: ${geocodedData.lat}, ${geocodedData.lng}`);
            }
        }
        return yield properties_model_1.PropertyModel.create(parsedData);
    }
    catch (error) {
        console.error("Property service error:", error);
        throw error;
    }
});
const updatePropertyService = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = Object.assign(Object.assign({}, data), { status: "pending" });
    return properties_model_1.PropertyModel.findByIdAndUpdate(id, updateData, { new: true });
});
const getSinglePropertyService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return properties_model_1.PropertyModel.findById(id)
        .populate("createdBy") // Populate the user object
        .populate("termsAndConditions"); // Populate terms and conditions
});
// const getAllPropertiesService = async (query: IPropertyQuery): Promise<IPropertyListResponse> => {
//     const { page = 1, limit = 10, search, status = "published", minPrice, maxPrice, propertyType, propertyTypes, guests, bedrooms, availableFrom, availableTo, location, amenities, rating } = query;
//     const filter: Record<string, any> = {
//         isDeleted: false,
//         status: status,
//     };
//     // Search filter
//     if (search) {
//         filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
//     }
//     // Price filter
//     if (minPrice !== undefined || maxPrice !== undefined) {
//         filter.price = {};
//         if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
//         if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
//     }
//     // Property type filter - SUPPORT BOTH SINGLE AND MULTIPLE
//     if (propertyTypes) {
//         // Handle comma-separated property types (from multiple selection)
//         let propertyTypesArray: string[];
//         if (typeof propertyTypes === "string") {
//             propertyTypesArray = propertyTypes.split(",").map((type) => type.trim());
//         } else if (Array.isArray(propertyTypes)) {
//             propertyTypesArray = propertyTypes;
//         } else {
//             propertyTypesArray = [];
//         }
//         // Filter out empty strings and create case-insensitive regex patterns
//         const propertyTypesRegex = propertyTypesArray.filter((type) => type.trim() !== "").map((type) => new RegExp(type.trim(), "i"));
//         if (propertyTypesRegex.length > 0) {
//             filter.propertyType = { $in: propertyTypesRegex };
//         }
//     } else if (propertyType) {
//         // Fallback to single property type for backward compatibility
//         filter.propertyType = { $regex: propertyType, $options: "i" };
//     }
//     // Guests filter - use maxGuests field
//     if (guests) {
//         filter.maxGuests = { $gte: Number(guests) };
//     }
//     // Bedrooms filter
//     if (bedrooms) {
//         filter.bedrooms = { $gte: Number(bedrooms) };
//     }
//     // Location filter
//     if (location) {
//         filter.location = { $regex: location, $options: "i" };
//     }
//     // Availability date filter
//     if (availableFrom || availableTo) {
//         // If both dates are provided
//         if (availableFrom && availableTo) {
//             const checkInDate = new Date(availableFrom);
//             const checkOutDate = new Date(availableTo);
//             filter.$and = [
//                 {
//                     $or: [{ availableFrom: { $lte: checkInDate } }, { availableFrom: null }],
//                 },
//                 {
//                     $or: [{ availableTo: { $gte: checkOutDate } }, { availableTo: null }],
//                 },
//             ];
//         }
//         // If only check-in date is provided
//         else if (availableFrom) {
//             const checkInDate = new Date(availableFrom);
//             filter.$or = [{ availableFrom: { $lte: checkInDate } }, { availableFrom: null }];
//         }
//         // If only check-out date is provided
//         else if (availableTo) {
//             const checkOutDate = new Date(availableTo);
//             filter.$or = [{ availableTo: { $gte: checkOutDate } }, { availableTo: null }];
//         }
//     }
//     // Amenities filter - FIXED
//     if (amenities) {
//         let amenitiesArray: string[];
//         if (typeof amenities === "string") {
//             amenitiesArray = amenities.split(",").map((a) => a.trim());
//         } else if (Array.isArray(amenities)) {
//             amenitiesArray = amenities;
//         } else {
//             amenitiesArray = [];
//         }
//         // Filter out empty strings and create case-insensitive regex patterns
//         const amenitiesRegex = amenitiesArray.filter((amenity) => amenity.trim() !== "").map((amenity) => new RegExp(amenity.trim(), "i"));
//         if (amenitiesRegex.length > 0) {
//             filter.amenities = { $all: amenitiesRegex };
//         }
//     }
//     // console.log("Final Filter:", JSON.stringify(filter, null, 2));
//     console.log(filter);
//     // console.log(rating);
//     const skip = (Number(page) - 1) * Number(limit);
//     const [properties, total] = await Promise.all([PropertyModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).populate("createdBy", "name email"), PropertyModel.countDocuments(filter)]);
//     return {
//         properties,
//         meta: {
//             total,
//             page: Number(page),
//             limit: Number(limit),
//             totalPages: Math.ceil(total / Number(limit)),
//         },
//     };
// };
// Update getAllPublishedPropertiesService to exclude deleted properties
const getAllPropertiesService = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search, status = "published", minPrice, maxPrice, propertyType, propertyTypes, guests, bedrooms, availableFrom, availableTo, location, amenities, rating } = query;
    const filter = {
        isDeleted: false,
        status: status,
    };
    // Search filter
    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }, { propertyNumber: { $regex: search, $options: "i" } }];
    }
    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined)
            filter.price.$gte = Number(minPrice);
        if (maxPrice !== undefined)
            filter.price.$lte = Number(maxPrice);
    }
    // Property type filter
    if (propertyTypes) {
        let propertyTypesArray;
        if (typeof propertyTypes === "string") {
            propertyTypesArray = propertyTypes.split(",").map((type) => type.trim());
        }
        else if (Array.isArray(propertyTypes)) {
            propertyTypesArray = propertyTypes;
        }
        else {
            propertyTypesArray = [];
        }
        const propertyTypesRegex = propertyTypesArray.filter((type) => type.trim() !== "").map((type) => new RegExp(type.trim(), "i"));
        if (propertyTypesRegex.length > 0) {
            filter.propertyType = { $in: propertyTypesRegex };
        }
    }
    else if (propertyType) {
        filter.propertyType = { $regex: propertyType, $options: "i" };
    }
    // Guests filter
    if (guests) {
        filter.maxGuests = { $gte: Number(guests) };
    }
    // Bedrooms filter
    if (bedrooms) {
        filter.bedrooms = { $gte: Number(bedrooms) };
    }
    // Location filter
    if (location) {
        filter.location = { $regex: location, $options: "i" };
    }
    // Availability date filter
    if (availableFrom || availableTo) {
        if (availableFrom && availableTo) {
            const checkInDate = new Date(availableFrom);
            const checkOutDate = new Date(availableTo);
            filter.$and = [{ $or: [{ availableFrom: { $lte: checkInDate } }, { availableFrom: null }] }, { $or: [{ availableTo: { $gte: checkOutDate } }, { availableTo: null }] }];
        }
        else if (availableFrom) {
            const checkInDate = new Date(availableFrom);
            filter.$or = [{ availableFrom: { $lte: checkInDate } }, { availableFrom: null }];
        }
        else if (availableTo) {
            const checkOutDate = new Date(availableTo);
            filter.$or = [{ availableTo: { $gte: checkOutDate } }, { availableTo: null }];
        }
    }
    // Amenities filter
    if (amenities) {
        let amenitiesArray;
        if (typeof amenities === "string") {
            amenitiesArray = amenities.split(",").map((a) => a.trim());
        }
        else if (Array.isArray(amenities)) {
            amenitiesArray = amenities;
        }
        else {
            amenitiesArray = [];
        }
        const amenitiesRegex = amenitiesArray.filter((amenity) => amenity.trim() !== "").map((amenity) => new RegExp(amenity.trim(), "i"));
        if (amenitiesRegex.length > 0) {
            filter.amenities = { $all: amenitiesRegex };
        }
    }
    const skip = (Number(page) - 1) * Number(limit);
    // If rating filter is applied, use aggregation pipeline
    if (rating) {
        // First, let's debug by checking what ratings actually exist
        console.log("Rating filter applied:", rating);
        // Build the main pipeline
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "propertyId",
                    as: "propertyRatings",
                },
            },
            {
                $addFields: {
                    averageRating: {
                        $cond: {
                            if: { $gt: [{ $size: "$propertyRatings" }, 0] },
                            then: {
                                $round: [
                                    {
                                        $avg: "$propertyRatings.overallExperience",
                                    },
                                    1,
                                ],
                            },
                            else: 0,
                        },
                    },
                    ratingsCount: { $size: "$propertyRatings" },
                },
            },
        ];
        // Add rating filter
        let ratingFilter = {};
        // switch (rating) {
        //     case "Good":
        //         ratingFilter.averageRating = { $gte: 3, $lt: 4 };
        //         break;
        //     case "Above Good":
        //         ratingFilter.averageRating = { $gte: 4, $lt: 5 };
        //         break;
        //     case "Excellent":
        //         ratingFilter.averageRating = { $gte: 5 };
        //         break;
        //     default:
        //         break;
        // }
        switch (rating) {
            case "Good":
                ratingFilter.averageRating = { $gte: 3 };
                break;
            case "Above Good":
                ratingFilter.averageRating = { $gte: 4 };
                break;
            case "Excellent":
                ratingFilter.averageRating = { $gte: 5 };
                break;
            default:
                break;
        }
        // Only add rating filter if it's defined
        if (Object.keys(ratingFilter).length > 0) {
            pipeline.push({ $match: ratingFilter });
        }
        // Add pagination and population at the end
        pipeline.push({ $skip: skip }, { $limit: Number(limit) }, {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [{ $project: { name: 1, email: 1 } }],
            },
        }, { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } });
        // Count pipeline (same as main pipeline but without pagination)
        const countPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "propertyId",
                    as: "propertyRatings",
                },
            },
            {
                $addFields: {
                    averageRating: {
                        $cond: {
                            if: { $gt: [{ $size: "$propertyRatings" }, 0] },
                            then: {
                                $round: [
                                    {
                                        $avg: "$propertyRatings.overallExperience",
                                    },
                                    1,
                                ],
                            },
                            else: 0,
                        },
                    },
                },
            },
        ];
        // Add rating filter to count pipeline
        if (Object.keys(ratingFilter).length > 0) {
            countPipeline.push({ $match: ratingFilter });
        }
        countPipeline.push({ $count: "total" });
        try {
            const [properties, totalResult] = yield Promise.all([properties_model_1.PropertyModel.aggregate(pipeline), properties_model_1.PropertyModel.aggregate(countPipeline)]);
            console.log(`Found ${properties.length} properties with rating filter`);
            console.log("Sample property with ratings:", properties.length > 0
                ? {
                    title: properties[0].title,
                    averageRating: properties[0].averageRating,
                    ratingsCount: properties[0].ratingsCount,
                }
                : "No properties found");
            const total = totalResult.length > 0 ? totalResult[0].total : 0;
            return {
                properties,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                },
            };
        }
        catch (error) {
            console.error("Aggregation error:", error);
            throw error;
        }
    }
    // If no rating filter, use normal query
    const [properties, total] = yield Promise.all([properties_model_1.PropertyModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).populate("createdBy", "name email"), properties_model_1.PropertyModel.countDocuments(filter)]);
    return {
        properties,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
        },
    };
});
const getAllPublishedPropertiesService = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search, type } = query; // Added 'type' parameter
    const filter = {
        status: "published",
        isDeleted: false,
    };
    // Handle different types: featured, trending, or all published
    if (type === "featured") {
        filter.featured = true;
    }
    else if (type === "trending") {
        filter.trending = true;
    }
    // If no type specified, it returns all published properties
    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }, { propertyNumber: { $regex: search, $options: "i" } }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = yield Promise.all([properties_model_1.PropertyModel.find(filter).populate("createdBy").populate("termsAndConditions").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), properties_model_1.PropertyModel.countDocuments(filter)]);
    // Calculate total amount (sum of all published properties' prices)
    const totalAmountResult = yield properties_model_1.PropertyModel.aggregate([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$price" } } }]);
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;
    return {
        properties,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalAmount,
        },
    };
});
const getAllNonPublishedPropertiesService = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search, status } = query;
    const filter = {
        status: { $ne: "published" },
        isDeleted: false, // Add soft delete filter
    };
    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }, { propertyNumber: { $regex: search, $options: "i" } }];
    }
    // If specific non-published status is provided, use it instead of excluding published
    if (status && status !== "published") {
        filter.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = yield Promise.all([properties_model_1.PropertyModel.find(filter).populate("createdBy").populate("termsAndConditions").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), properties_model_1.PropertyModel.countDocuments(filter)]);
    // Calculate total amount (sum of all non-published properties' prices)
    const totalAmountResult = yield properties_model_1.PropertyModel.aggregate([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$price" } } }]);
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;
    return {
        properties,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            // totalPages: Math.ceil(total / Number(limit)),
            totalAmount,
        },
    };
});
const changePropertyStatusService = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const property = yield properties_model_1.PropertyModel.findByIdAndUpdate(id, { status }, { new: true });
    return property;
});
// Update getHostPropertiesService to include soft delete filter
const getHostPropertiesService = (hostId, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!hostId) {
        throw new Error("Host ID is required");
    }
    const { page = 1, limit = 10, search, status } = query;
    const filter = {
        createdBy: new mongoose_1.Types.ObjectId(hostId),
        isDeleted: false, // Add soft delete filter
    };
    // Add search filter
    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
    }
    // Add status filter
    if (status) {
        filter.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = yield Promise.all([properties_model_1.PropertyModel.find(filter).populate("createdBy").populate("termsAndConditions").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), properties_model_1.PropertyModel.countDocuments(filter)]);
    // Calculate total amount (sum of all properties' prices)
    const totalAmountResult = yield properties_model_1.PropertyModel.aggregate([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$price" } } }]);
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;
    return {
        properties,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
            totalAmount,
        },
    };
});
const deleteHostPropertyService = (hostId, propertyId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!hostId) {
        throw new Error("Host ID is required");
    }
    // Find the property and verify ownership
    const property = yield properties_model_1.PropertyModel.findOne({
        _id: propertyId,
        createdBy: new mongoose_1.Types.ObjectId(hostId),
    });
    if (!property) {
        throw new Error("Property not found or you don't have permission to delete it");
    }
    // Check if property is already deleted
    if (property.isDeleted) {
        throw new Error("Property is already deleted");
    }
    // Check if property is published
    if (property.status === "published") {
        throw new Error("Cannot delete published properties");
    }
    // Soft delete - set isDeleted to true instead of removing from database
    const result = yield properties_model_1.PropertyModel.findByIdAndUpdate(propertyId, {
        isDeleted: true,
        status: "hidden", // Optionally change status to hidden when deleted
    }, { new: true });
    if (!result) {
        throw new Error("Failed to delete property");
    }
    return result;
});
const getMyPublishedPropertiesService = (hostId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!hostId) {
        throw new Error("Host ID is required");
    }
    const properties = yield properties_model_1.PropertyModel.find({
        createdBy: new mongoose_1.Types.ObjectId(hostId),
        status: "published",
        isDeleted: false,
    })
        .select("propertyNumber _id createdBy price")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
    return properties;
});
const searchMyPublishedPropertiesService = (hostId, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!hostId) {
        throw new Error("Host ID is required");
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    // Build filter
    const filter = {
        createdBy: new mongoose_1.Types.ObjectId(hostId),
        status: "published",
        isDeleted: false,
    };
    // Add search filter for title and propertyNumber
    if (query.search) {
        filter.$or = [{ title: { $regex: query.search, $options: "i" } }, { propertyNumber: { $regex: query.search, $options: "i" } }];
    }
    // Get properties with pagination
    const [properties, total] = yield Promise.all([properties_model_1.PropertyModel.find(filter).select("propertyNumber _id createdBy price title description location propertyType coverPhoto createdAt").populate("createdBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit), properties_model_1.PropertyModel.countDocuments(filter)]);
    return {
        properties,
        meta: {
            page,
            limit,
            total,
        },
    };
});
const getMaxRoundedPriceService = () => __awaiter(void 0, void 0, void 0, function* () {
    // Find the maximum price from all published properties
    const maxPriceProperty = yield properties_model_1.PropertyModel.findOne({
        isDeleted: false,
        status: "published",
    }, { price: 1 })
        .sort({ price: -1 })
        .limit(1);
    if (!maxPriceProperty || !maxPriceProperty.price) {
        return 10000; // Default max price if no properties found
    }
    const maxPrice = maxPriceProperty.price;
    // Round up to nearest thousand
    const roundedMaxPrice = Math.ceil(maxPrice / 1000) * 1000;
    return roundedMaxPrice;
});
const toggleFeaturedStatusService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const property = yield properties_model_1.PropertyModel.findById(id);
    if (!property) {
        return null;
    }
    const updatedProperty = yield properties_model_1.PropertyModel.findByIdAndUpdate(id, { featured: !property.featured }, { new: true }).populate("createdBy", "name email profileImg phone isVerifiedByAdmin").populate("termsAndConditions", "title content version");
    return updatedProperty;
});
const toggleTrendingStatusService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const property = yield properties_model_1.PropertyModel.findById(id);
    if (!property) {
        return null;
    }
    const updatedProperty = yield properties_model_1.PropertyModel.findByIdAndUpdate(id, { trending: !property.trending }, { new: true }).populate("createdBy", "name email profileImg phone isVerifiedByAdmin").populate("termsAndConditions", "title content version");
    return updatedProperty;
});
exports.propertyServices = {
    createPropertyService,
    updatePropertyService,
    getSinglePropertyService,
    getAllPropertiesService,
    getAllPublishedPropertiesService,
    getAllNonPublishedPropertiesService,
    changePropertyStatusService,
    getHostPropertiesService,
    deleteHostPropertyService,
    getMyPublishedPropertiesService,
    searchMyPublishedPropertiesService,
    // max price
    getMaxRoundedPriceService,
    // Toggle
    toggleFeaturedStatusService,
    toggleTrendingStatusService,
};
