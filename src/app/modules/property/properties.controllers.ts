import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../../utils/sendResponse.";
import { propertyServices } from "./properties.services";
import { IProperty, IPropertyQuery } from "./properties.interface";

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

    // Parse amenities if it's a string
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
    const files = req.files as MulterFiles; // type assertion
    const coverPhotoFile = files?.coverPhoto?.[0];
    const photosFiles = files?.photos || [];

    const mediaData: Partial<IProperty> = {};

    if (coverPhotoFile) mediaData.coverPhoto = `/uploads/photos/${coverPhotoFile.filename}`;
    if (photosFiles.length > 0) mediaData.photos = photosFiles.map((file) => `/uploads/photos/${file.filename}`);

    const propertyData: Partial<IProperty> = {
        ...req.body,
        ...mediaData,
    };

    const property = await propertyServices.updatePropertyService(req.params.id, propertyData);

    sendResponse(res, {
        statusCode: property ? httpStatus.OK : httpStatus.NOT_FOUND,
        success: !!property,
        message: property ? "Property updated successfully" : "Property not found",
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
    const data = await propertyServices.getAllPropertiesService(query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Properties retrieved successfully",
        data: data.properties,
        meta: data.meta,
    });
});

const getAllPropertiesForAdminController = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as IPropertyQuery;

    const data = await propertyServices.getAllPropertiesForAdminService(query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All properties retrieved successfully for admin",
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
export const propertyControllers = {
    createPropertyController,
    updatePropertyController,
    getSinglePropertyController,
    getAllPropertiesController,
    getAllPropertiesForAdminController,
    changePropertyStatusController,
};
