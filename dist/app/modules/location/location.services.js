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
exports.locationServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const location_model_1 = require("./location.model");
const mongoose_1 = require("mongoose");
const createLocation = (locationData) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if location already exists (including inactive ones)
    const existingLocation = yield location_model_1.Location.findOne({
        name: { $regex: new RegExp(`^${locationData.name}$`, "i") },
    });
    if (existingLocation) {
        // If location exists but is inactive, reactivate it instead of creating new
        if (!existingLocation.isActive) {
            const reactivatedLocation = yield location_model_1.Location.findByIdAndUpdate(existingLocation._id, { isActive: true }, { new: true });
            return reactivatedLocation;
        }
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Location already exists");
    }
    const location = yield location_model_1.Location.create(locationData);
    return location;
});
const getAllLocations = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    const { search, isActive, page = 1, limit = 10, sortBy = "name", sortOrder = "asc" } = filters;
    const filter = {};
    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }
    if (isActive !== undefined) {
        filter.isActive = isActive;
    }
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    const locations = yield location_model_1.Location.find(filter).sort(sortOptions).skip(skip).limit(limit);
    const totalLocations = yield location_model_1.Location.countDocuments(filter);
    return {
        data: locations,
        meta: {
            page,
            limit,
            total: totalLocations,
        },
    };
});
const getLocationById = (locationId) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate ObjectId
    if (!mongoose_1.Types.ObjectId.isValid(locationId)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid location ID");
    }
    const location = yield location_model_1.Location.findById(locationId);
    if (!location) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Location not found");
    }
    return location;
});
const updateLocation = (locationId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate ObjectId
    if (!mongoose_1.Types.ObjectId.isValid(locationId)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid location ID");
    }
    const location = yield location_model_1.Location.findById(locationId);
    if (!location) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Location not found");
    }
    // Check if name already exists (if name is being updated)
    if (updateData.name && updateData.name !== location.name) {
        const existingLocation = yield location_model_1.Location.findOne({
            name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
            _id: { $ne: new mongoose_1.Types.ObjectId(locationId) },
        });
        if (existingLocation) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Location name already exists");
        }
    }
    const updatedLocation = yield location_model_1.Location.findByIdAndUpdate(locationId, updateData, { new: true, runValidators: true });
    return updatedLocation;
});
const deleteLocation = (locationId) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate ObjectId
    if (!mongoose_1.Types.ObjectId.isValid(locationId)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid location ID");
    }
    const location = yield location_model_1.Location.findById(locationId);
    if (!location) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Location not found");
    }
    // Soft delete by setting isActive to false
    const deletedLocation = yield location_model_1.Location.findByIdAndUpdate(locationId, { isActive: false }, { new: true });
    return deletedLocation;
});
const searchLocations = (searchTerm) => __awaiter(void 0, void 0, void 0, function* () {
    if (!searchTerm || searchTerm.trim().length < 2) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Search term must be at least 2 characters long");
    }
    const locations = yield location_model_1.Location.find({
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
});
exports.locationServices = {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocation,
    deleteLocation,
    searchLocations,
};
