import httpStatus from "http-status";
import { ICreateLocationDto, IUpdateLocationDto } from "./location.interface";
import ApiError from "../../../errors/ApiError";
import { Location } from "./location.model";
import { Types } from "mongoose";

export interface ILocationFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

const createLocation = async (locationData: ICreateLocationDto) => {
    // Check if location already exists (including inactive ones)
    const existingLocation = await Location.findOne({
        name: { $regex: new RegExp(`^${locationData.name}$`, "i") },
    });

    if (existingLocation) {
        // If location exists but is inactive, reactivate it instead of creating new
        if (!existingLocation.isActive) {
            const reactivatedLocation = await Location.findByIdAndUpdate(existingLocation._id, { isActive: true }, { new: true });
            return reactivatedLocation;
        }
        throw new ApiError(httpStatus.BAD_REQUEST, "Location already exists");
    }

    const location = await Location.create(locationData);
    return location;
};

const getAllLocations = async (filters: ILocationFilters = {}) => {
    const { search, isActive, page = 1, limit = 10, sortBy = "name", sortOrder = "asc" } = filters;

    const filter: any = {};

    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    if (isActive !== undefined) {
        filter.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const locations = await Location.find(filter).sort(sortOptions).skip(skip).limit(limit);

    const totalLocations = await Location.countDocuments(filter);

    return {
        data: locations,
        meta: {
            page,
            limit,
            total: totalLocations,
        },
    };
};

const getLocationById = async (locationId: string) => {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(locationId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid location ID");
    }

    const location = await Location.findById(locationId);
    if (!location) {
        throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
    }
    return location;
};

const updateLocation = async (locationId: string, updateData: IUpdateLocationDto) => {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(locationId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid location ID");
    }

    const location = await Location.findById(locationId);
    if (!location) {
        throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
    }

    // Check if name already exists (if name is being updated)
    if (updateData.name && updateData.name !== location.name) {
        const existingLocation = await Location.findOne({
            name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
            _id: { $ne: new Types.ObjectId(locationId) },
        });

        if (existingLocation) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Location name already exists");
        }
    }

    const updatedLocation = await Location.findByIdAndUpdate(locationId, updateData, { new: true, runValidators: true });

    return updatedLocation;
};

const deleteLocation = async (locationId: string) => {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(locationId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid location ID");
    }

    const location = await Location.findById(locationId);
    if (!location) {
        throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
    }

    // Soft delete by setting isActive to false
    const deletedLocation = await Location.findByIdAndUpdate(locationId, { isActive: false }, { new: true });

    return deletedLocation;
};

const searchLocations = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Search term must be at least 2 characters long");
    }

    const locations = await Location.find({
        $and: [
            { isActive: true },
            {
                $or: [{ name: { $regex: searchTerm, $options: "i" } }],
            },
        ],
    })
        .sort({ name: 1 })
        .limit(20);

    return locations;
};

export const locationServices = {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocation,
    deleteLocation,
    searchLocations,
};
