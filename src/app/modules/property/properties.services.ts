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
    return PropertyModel.findByIdAndUpdate(id, data, { new: true });
};

const getSinglePropertyService = async (id: string): Promise<IProperty | null> => {
    return PropertyModel.findById(id)
        .populate("createdBy") // Populate the user object
        .populate("termsAndConditions"); // Populate terms and conditions
};

// Update getAllPropertiesService to exclude deleted properties
const getAllPropertiesService = async (query: IPropertyQuery): Promise<IPropertyListResponse> => {
    const { page = 1, limit = 10, search, status, createdBy } = query;

    const filter: Record<string, any> = {
        isDeleted: false, // Add soft delete filter
    };

    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
    }

    if (status) filter.status = status;
    if (createdBy) filter.createdBy = new Types.ObjectId(createdBy);

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([PropertyModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), PropertyModel.countDocuments(filter)]);

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
};
