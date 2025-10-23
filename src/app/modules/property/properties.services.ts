import { PropertyModel } from "./properties.model";
import { IProperty, IPropertyListResponse, IPropertyQuery } from "./properties.interface";
import { Types } from "mongoose";
import { geocodeAddress } from "./geocodingService";

const createPropertyService = async (data: IProperty): Promise<IProperty> => {
    try {
        // Parse data
        const parsedData = {
            ...data,
            maxGuests: Number(data.maxGuests),
            bedrooms: Number(data.bedrooms),
            bathrooms: Number(data.bathrooms),
            price: Number(data.price),
            availableFrom: new Date(data.availableFrom),
            availableTo: new Date(data.availableTo),
            amenities: Array.isArray(data.amenities) ? data.amenities : [],
        };

        // Get coordinates from geocoding
        if (parsedData.location && parsedData.postCode) {
            const geocodedData = await geocodeAddress(parsedData.location, parsedData.postCode);

            if (geocodedData) {
                parsedData.coordinates = {
                    lat: geocodedData.lat,
                    lng: geocodedData.lng,
                };
                console.log(`Coordinates found: ${geocodedData.lat}, ${geocodedData.lng}`);
            }
        }

        return await PropertyModel.create(parsedData);
    } catch (error) {
        console.error("Property service error:", error);
        throw error;
    }
};

const updatePropertyService = async (id: string, data: Partial<IProperty>): Promise<IProperty | null> => {
    const updateData = {
        ...data,
        status: "pending" as const,
    };

    return PropertyModel.findByIdAndUpdate(id, updateData, { new: true });
};

const getSinglePropertyService = async (id: string): Promise<IProperty | null> => {
    return PropertyModel.findById(id)
        .populate("createdBy") // Populate the user object
        .populate("termsAndConditions"); // Populate terms and conditions
};

const getAllPropertiesService = async (query: IPropertyQuery): Promise<IPropertyListResponse> => {
    const { page = 1, limit = 10, search, status = "published", minPrice, maxPrice, propertyType, guests, bedrooms, availableFrom, availableTo, location, amenities } = query;

    const filter: Record<string, any> = {
        isDeleted: false,
        status: status,
    };

    // Search filter
    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Property type filter
    if (propertyType) {
        filter.propertyType = { $regex: propertyType, $options: "i" };
    }

    // Guests filter - use maxGuests field
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
        // If both dates are provided
        if (availableFrom && availableTo) {
            const checkInDate = new Date(availableFrom);
            const checkOutDate = new Date(availableTo);

            filter.$and = [
                {
                    $or: [{ availableFrom: { $lte: checkInDate } }, { availableFrom: null }],
                },
                {
                    $or: [{ availableTo: { $gte: checkOutDate } }, { availableTo: null }],
                },
            ];
        }
        // If only check-in date is provided
        else if (availableFrom) {
            const checkInDate = new Date(availableFrom);
            filter.$or = [{ availableFrom: { $lte: checkInDate } }, { availableFrom: null }];
        }
        // If only check-out date is provided
        else if (availableTo) {
            const checkOutDate = new Date(availableTo);
            filter.$or = [{ availableTo: { $gte: checkOutDate } }, { availableTo: null }];
        }
    }

    // Amenities filter - FIXED
    if (amenities) {
        let amenitiesArray: string[];

        if (typeof amenities === "string") {
            amenitiesArray = amenities.split(",").map((a) => a.trim());
        } else if (Array.isArray(amenities)) {
            amenitiesArray = amenities;
        } else {
            amenitiesArray = [];
        }

        // Filter out empty strings and create case-insensitive regex patterns
        const amenitiesRegex = amenitiesArray.filter((amenity) => amenity.trim() !== "").map((amenity) => new RegExp(amenity.trim(), "i"));

        if (amenitiesRegex.length > 0) {
            filter.amenities = { $all: amenitiesRegex };
        }
    }

    console.log("Final Filter:", JSON.stringify(filter, null, 2));

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([PropertyModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).populate("createdBy", "name email"), PropertyModel.countDocuments(filter)]);

    return {
        properties,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

// Update getAllPublishedPropertiesService to exclude deleted properties
const getAllPublishedPropertiesService = async (query: IPropertyQuery): Promise<IPropertyListResponse> => {
    const { page = 1, limit = 10, search } = query;

    const filter: Record<string, any> = {
        status: "published",
        isDeleted: false, // Add soft delete filter
    };

    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([PropertyModel.find(filter).populate("createdBy").populate("termsAndConditions").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), PropertyModel.countDocuments(filter)]);

    // Calculate total amount (sum of all published properties' prices)
    const totalAmountResult = await PropertyModel.aggregate([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$price" } } }]);

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
};

const getAllNonPublishedPropertiesService = async (query: IPropertyQuery): Promise<IPropertyListResponse> => {
    const { page = 1, limit = 10, search, status } = query;

    const filter: Record<string, any> = {
        status: { $ne: "published" },
        isDeleted: false, // Add soft delete filter
    };

    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
    }

    // If specific non-published status is provided, use it instead of excluding published
    if (status && status !== "published") {
        filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([PropertyModel.find(filter).populate("createdBy").populate("termsAndConditions").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), PropertyModel.countDocuments(filter)]);

    // Calculate total amount (sum of all non-published properties' prices)
    const totalAmountResult = await PropertyModel.aggregate([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$price" } } }]);

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
};

const changePropertyStatusService = async (id: string, status: string): Promise<IProperty | null> => {
    const property = await PropertyModel.findByIdAndUpdate(id, { status }, { new: true });

    return property;
};

// Update getHostPropertiesService to include soft delete filter
const getHostPropertiesService = async (hostId: string, query: IPropertyQuery) => {
    if (!hostId) {
        throw new Error("Host ID is required");
    }

    const { page = 1, limit = 10, search, status } = query;

    const filter: Record<string, any> = {
        createdBy: new Types.ObjectId(hostId),
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

    const [properties, total] = await Promise.all([PropertyModel.find(filter).populate("createdBy").populate("termsAndConditions").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), PropertyModel.countDocuments(filter)]);

    // Calculate total amount (sum of all properties' prices)
    const totalAmountResult = await PropertyModel.aggregate([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$price" } } }]);

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
};

const deleteHostPropertyService = async (hostId: string, propertyId: string) => {
    if (!hostId) {
        throw new Error("Host ID is required");
    }

    // Find the property and verify ownership
    const property = await PropertyModel.findOne({
        _id: propertyId,
        createdBy: new Types.ObjectId(hostId),
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
    const result = await PropertyModel.findByIdAndUpdate(
        propertyId,
        {
            isDeleted: true,
            status: "hidden", // Optionally change status to hidden when deleted
        },
        { new: true }
    );

    if (!result) {
        throw new Error("Failed to delete property");
    }

    return result;
};

const getMyPublishedPropertiesService = async (hostId: string) => {
    if (!hostId) {
        throw new Error("Host ID is required");
    }

    const properties = await PropertyModel.find({
        createdBy: new Types.ObjectId(hostId),
        status: "published",
        isDeleted: false,
    })
        .select("propertyNumber _id createdBy price")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return properties;
};

const searchMyPublishedPropertiesService = async (
    hostId: string,
    query: {
        page?: number;
        limit?: number;
        search?: string;
    }
) => {
    if (!hostId) {
        throw new Error("Host ID is required");
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {
        createdBy: new Types.ObjectId(hostId),
        status: "published",
        isDeleted: false,
    };

    // Add search filter for title and propertyNumber
    if (query.search) {
        filter.$or = [{ title: { $regex: query.search, $options: "i" } }, { propertyNumber: { $regex: query.search, $options: "i" } }];
    }

    // Get properties with pagination
    const [properties, total] = await Promise.all([PropertyModel.find(filter).select("propertyNumber _id createdBy price title description location propertyType coverPhoto createdAt").populate("createdBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit), PropertyModel.countDocuments(filter)]);

    return {
        properties,
        meta: {
            page,
            limit,
            total,
        },
    };
};

export const propertyServices = {
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
};
