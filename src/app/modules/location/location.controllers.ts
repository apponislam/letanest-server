import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import { ILocationFilters, locationServices } from "./location.services";
import sendResponse from "../../../utils/sendResponse.";

const createLocation = catchAsync(async (req, res) => {
    const location = await locationServices.createLocation(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Location created successfully",
        data: location,
    });
});

const getAllLocations = catchAsync(async (req, res) => {
    const { search, isActive, page = 1, limit = 10, sortBy = "name", sortOrder = "asc" } = req.query;

    const filters: ILocationFilters = {
        search: search as string,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
    };

    const result = await locationServices.getAllLocations(filters);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Locations fetched successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getLocationById = catchAsync(async (req, res) => {
    const { locationId } = req.params;
    const location = await locationServices.getLocationById(locationId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Location fetched successfully",
        data: location,
    });
});

const updateLocation = catchAsync(async (req, res) => {
    const { locationId } = req.params;
    const location = await locationServices.updateLocation(locationId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Location updated successfully",
        data: location,
    });
});

const deleteLocation = catchAsync(async (req, res) => {
    const { locationId } = req.params;
    const location = await locationServices.deleteLocation(locationId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Location deleted successfully",
        data: location,
    });
});

const searchLocations = catchAsync(async (req, res) => {
    const { search } = req.query;
    const locations = await locationServices.searchLocations(search as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Locations searched successfully",
        data: locations,
    });
});

export const locationControllers = {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocation,
    deleteLocation,
    searchLocations,
};
