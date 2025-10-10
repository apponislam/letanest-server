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
    return PropertyModel.findById(id);
};

const getAllPropertiesService = async (query: IPropertyQuery): Promise<IPropertyListResponse> => {
    const { page = 1, limit = 10, search, status, createdBy } = query;

    const filter: Record<string, any> = {};

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

const getAllPropertiesForAdminService = async (query: IPropertyQuery): Promise<IPropertyListResponse> => {
    const { page = 1, limit = 10, search, status } = query;

    const filter: Record<string, any> = {};

    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
    }

    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([PropertyModel.find(filter).populate("createdBy").populate("termsAndConditions").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), PropertyModel.countDocuments(filter)]);

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

const changePropertyStatusService = async (id: string, status: string): Promise<IProperty | null> => {
    const property = await PropertyModel.findByIdAndUpdate(id, { status }, { new: true });

    return property;
};

export const propertyServices = {
    createPropertyService,
    updatePropertyService,
    getSinglePropertyService,
    getAllPropertiesService,
    getAllPropertiesForAdminService,
    changePropertyStatusService,
};
