import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../../utils/sendResponse.";
import { propertyServices } from "./properties.services";
import { IProperty, IPropertyQuery, UpdatePropertyRequest } from "./properties.interface";
import ApiError from "../../../errors/ApiError";

interface MulterFiles {
    coverPhoto?: Express.Multer.File[];
    photos?: Express.Multer.File[];
}

const createPropertyController = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as MulterFiles;
    const coverPhotoFile = files?.coverPhoto?.[0];
    const photosFiles = files?.photos || [];
    const mediaData: Partial<IProperty> = {};
    if (coverPhotoFile) mediaData.coverPhoto = `/uploads/photos/${coverPhotoFile.filename}`;
    if (photosFiles.length > 0) mediaData.photos = photosFiles.map((file) => `/uploads/photos/${file.filename}`);
    const propertyData: Partial<IProperty> = {
        ...req.body,
        ...mediaData,
        createdBy: (req.user as any)?._id,
        agreeTerms: req.body.agreeTerms === "true" || req.body.agreeTerms === true,
    };
    if (typeof req.body.amenities === "string") {
        try {
            propertyData.amenities = JSON.parse(req.body.amenities);
        } catch (e) {
            propertyData.amenities = [];
        }
    }
    const property = await propertyServices.createPropertyService(propertyData as IProperty);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Property created successfully",
        data: property,
    });
});

const updatePropertyController = catchAsync(async (req: Request, res: Response) => {
    // const files = req.files as MulterFiles;
    // const coverPhotoFile = files?.coverPhoto?.[0];
    // const photosFiles = files?.photos || [];

    // const mediaData: Partial<IProperty> = {};

    // if (coverPhotoFile) mediaData.coverPhoto = `/uploads/photos/${coverPhotoFile.filename}`;
    // if (photosFiles.length > 0) mediaData.photos = photosFiles.map((file) => `/uploads/photos/${file.filename}`);

    // const propertyData: Partial<IProperty> = {
    //     ...req.body,
    //     ...mediaData,
    // };

    // console.log(mediaData);

    const files = req.files as MulterFiles;
    const coverPhotoFile = files?.coverPhoto?.[0];
    const photosFiles = files?.photos || [];

    // Cast req.body to UpdatePropertyRequest
    const body = req.body as UpdatePropertyRequest;
    const { removeCoverPhoto, existingPhotos, ...propertyFields } = body;

    const mediaData: Partial<IProperty> = {};

    // Handle cover photo
    if (coverPhotoFile) {
        mediaData.coverPhoto = `/uploads/photos/${coverPhotoFile.filename}`;
    } else if (removeCoverPhoto === "true") {
        mediaData.coverPhoto = undefined;
    }

    // Handle photos - combine existing and new
    const photos: string[] = [];

    // Add existing photos that should be kept
    if (existingPhotos && Array.isArray(existingPhotos)) {
        photos.push(...existingPhotos);
    }

    // Add new photos
    if (photosFiles.length > 0) {
        photos.push(...photosFiles.map((file) => `/uploads/photos/${file.filename}`));
    }

    mediaData.photos = photos;

    // Combine all data - propertyFields doesn't include the temporary fields
    const propertyData: Partial<IProperty> = {
        ...propertyFields,
        ...mediaData,
    };

    console.log(propertyData);

    const property = await propertyServices.updatePropertyService(req.params.id, propertyData);

    sendResponse(res, {
        statusCode: property ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!property,
        message: property ? "Property updated successfully" : "Property not found",
        data: property || null,
    });
});

const refreshNearbyPlacesController = catchAsync(async (req: Request, res: Response) => {
    const property = await propertyServices.refreshNearbyPlacesService(req.params.id);

    sendResponse(res, {
        statusCode: property ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!property,
        message: property ? "Nearby places refreshed successfully" : "Property not found or no coordinates available",
        data: property || null,
    });
});

const getSinglePropertyController = catchAsync(async (req: Request, res: Response) => {
    const property = await propertyServices.getSinglePropertyService(req.params.id);

    sendResponse(res, {
        statusCode: property ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!property,
        message: property ? "Property retrieved successfully" : "Property not found",
        data: property || null,
    });
});

const getAllPropertiesController = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as IPropertyQuery;

    // query.seed = Date.now().toString();

    const data = await propertyServices.getAllPropertiesService(query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Properties retrieved successfully",
        data: data.properties,
        meta: data.meta,
    });
});

const getAllPublishedPropertiesController = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as IPropertyQuery;

    const data = await propertyServices.getAllPublishedPropertiesService(query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Published properties retrieved successfully",
        data: data.properties,
        meta: data.meta,
    });
});

const getAllNonPublishedPropertiesController = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as IPropertyQuery;

    const data = await propertyServices.getAllNonPublishedPropertiesService(query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Non-published properties retrieved successfully",
        data: data.properties,
        meta: data.meta,
    });
});

const changePropertyStatusController = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const property = await propertyServices.changePropertyStatusService(id, status);

    sendResponse(res, {
        statusCode: property ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!property,
        message: property ? "Property status updated successfully" : "Property not found",
        data: property || null,
    });
});

// Get host properties
const getHostProperties = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.user?._id;
    const query = req.query;

    const result = await propertyServices.getHostPropertiesService(hostId, query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Host properties retrieved successfully",
        data: result.properties,
        meta: result.meta,
    });
});

// Delete host property - THIS IS THE CONTROLLER FOR THE DELETE ROUTE
const deleteHostProperty = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.user?._id;
    const propertyId = req.params.id;

    const result = await propertyServices.deleteHostPropertyService(hostId, propertyId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Property deleted successfully",
        data: result,
    });
});

const getMyPublishedPropertiesController = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.user?._id;

    const properties = await propertyServices.getMyPublishedPropertiesService(hostId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My published properties retrieved successfully",
        data: properties,
    });
});

const searchMyPublishedPropertiesController = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.user?._id;
    const { page = 1, limit = 10, search = "" } = req.query;

    const result = await propertyServices.searchMyPublishedPropertiesService(hostId, {
        page: Number(page),
        limit: Number(limit),
        search: search as string,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Properties searched successfully",
        data: result.properties,
        meta: result.meta,
    });
});

const getMaxRoundedPriceController = catchAsync(async (req: Request, res: Response) => {
    const maxRoundedPrice = await propertyServices.getMaxRoundedPriceService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Maximum rounded price retrieved successfully",
        data: { maxRoundedPrice },
    });
});

const toggleFeaturedStatusController = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await propertyServices.toggleFeaturedStatusService(id);

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Property ${result.featured ? "set as" : "removed from"} featured successfully`,
        data: result,
    });
});

const toggleTrendingStatusController = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await propertyServices.toggleTrendingStatusService(id);

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Property ${result.trending ? "set as" : "removed from"} trending successfully`,
        data: result,
    });
});

const toggleCalendarController = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { calendarEnabled, availableFrom, availableTo } = req.body;

    if (typeof calendarEnabled !== "boolean") {
        throw new ApiError(httpStatus.BAD_REQUEST, "calendarEnabled is required and must be a boolean");
    }

    if (availableFrom && availableTo) {
        const fromDate = new Date(availableFrom);
        const toDate = new Date(availableTo);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format for availableFrom or availableTo");
        }

        if (fromDate >= toDate) {
            throw new ApiError(httpStatus.BAD_REQUEST, "availableFrom must be before availableTo");
        }
    }

    const result = await propertyServices.toggleCalendarService(id, calendarEnabled, availableFrom, availableTo);

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Calendar ${calendarEnabled ? "opened" : "closed"} successfully`,
        data: result,
    });
});

export const propertyControllers = {
    createPropertyController,
    updatePropertyController,
    refreshNearbyPlacesController,
    getSinglePropertyController,
    getAllPropertiesController,
    getAllPublishedPropertiesController,
    getAllNonPublishedPropertiesController,
    changePropertyStatusController,
    getHostProperties,
    deleteHostProperty,
    getMyPublishedPropertiesController,
    searchMyPublishedPropertiesController,

    // max price
    getMaxRoundedPriceController,

    // Toggle
    toggleFeaturedStatusController,
    toggleTrendingStatusController,
    toggleCalendarController,
};
