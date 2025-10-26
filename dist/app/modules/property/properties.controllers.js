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
exports.propertyControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const properties_services_1 = require("./properties.services");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createPropertyController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const files = req.files;
    const coverPhotoFile = (_a = files === null || files === void 0 ? void 0 : files.coverPhoto) === null || _a === void 0 ? void 0 : _a[0];
    const photosFiles = (files === null || files === void 0 ? void 0 : files.photos) || [];
    const mediaData = {};
    if (coverPhotoFile)
        mediaData.coverPhoto = `/uploads/photos/${coverPhotoFile.filename}`;
    if (photosFiles.length > 0)
        mediaData.photos = photosFiles.map((file) => `/uploads/photos/${file.filename}`);
    const propertyData = Object.assign(Object.assign(Object.assign({}, req.body), mediaData), { createdBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id, agreeTerms: req.body.agreeTerms === "true" || req.body.agreeTerms === true });
    // Parse amenities if it's a string
    if (typeof req.body.amenities === "string") {
        try {
            propertyData.amenities = JSON.parse(req.body.amenities);
        }
        catch (e) {
            propertyData.amenities = [];
        }
    }
    const property = yield properties_services_1.propertyServices.createPropertyService(propertyData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Property created successfully",
        data: property,
    });
}));
const updatePropertyController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const files = req.files;
    const coverPhotoFile = (_a = files === null || files === void 0 ? void 0 : files.coverPhoto) === null || _a === void 0 ? void 0 : _a[0];
    const photosFiles = (files === null || files === void 0 ? void 0 : files.photos) || [];
    const mediaData = {};
    if (coverPhotoFile)
        mediaData.coverPhoto = `/uploads/photos/${coverPhotoFile.filename}`;
    if (photosFiles.length > 0)
        mediaData.photos = photosFiles.map((file) => `/uploads/photos/${file.filename}`);
    const propertyData = Object.assign(Object.assign({}, req.body), mediaData);
    const property = yield properties_services_1.propertyServices.updatePropertyService(req.params.id, propertyData);
    (0, sendResponse_1.default)(res, {
        statusCode: property ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!property,
        message: property ? "Property updated successfully" : "Property not found",
        data: property || null,
    });
}));
const getSinglePropertyController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const property = yield properties_services_1.propertyServices.getSinglePropertyService(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: property ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!property,
        message: property ? "Property retrieved successfully" : "Property not found",
        data: property || null,
    });
}));
const getAllPropertiesController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const data = yield properties_services_1.propertyServices.getAllPropertiesService(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Properties retrieved successfully",
        data: data.properties,
        meta: data.meta,
    });
}));
const getAllPublishedPropertiesController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const data = yield properties_services_1.propertyServices.getAllPublishedPropertiesService(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Published properties retrieved successfully",
        data: data.properties,
        meta: data.meta,
    });
}));
const getAllNonPublishedPropertiesController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const data = yield properties_services_1.propertyServices.getAllNonPublishedPropertiesService(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Non-published properties retrieved successfully",
        data: data.properties,
        meta: data.meta,
    });
}));
const changePropertyStatusController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const property = yield properties_services_1.propertyServices.changePropertyStatusService(id, status);
    (0, sendResponse_1.default)(res, {
        statusCode: property ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!property,
        message: property ? "Property status updated successfully" : "Property not found",
        data: property || null,
    });
}));
// Get host properties
const getHostProperties = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hostId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const query = req.query;
    const result = yield properties_services_1.propertyServices.getHostPropertiesService(hostId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Host properties retrieved successfully",
        data: result.properties,
        meta: result.meta,
    });
}));
// Delete host property - THIS IS THE CONTROLLER FOR THE DELETE ROUTE
const deleteHostProperty = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hostId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const propertyId = req.params.id;
    const result = yield properties_services_1.propertyServices.deleteHostPropertyService(hostId, propertyId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Property deleted successfully",
        data: result,
    });
}));
const getMyPublishedPropertiesController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hostId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const properties = yield properties_services_1.propertyServices.getMyPublishedPropertiesService(hostId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "My published properties retrieved successfully",
        data: properties,
    });
}));
const searchMyPublishedPropertiesController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hostId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { page = 1, limit = 10, search = "" } = req.query;
    const result = yield properties_services_1.propertyServices.searchMyPublishedPropertiesService(hostId, {
        page: Number(page),
        limit: Number(limit),
        search: search,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Properties searched successfully",
        data: result.properties,
        meta: result.meta,
    });
}));
const getMaxRoundedPriceController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const maxRoundedPrice = yield properties_services_1.propertyServices.getMaxRoundedPriceService();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Maximum rounded price retrieved successfully",
        data: { maxRoundedPrice },
    });
}));
const toggleFeaturedStatusController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield properties_services_1.propertyServices.toggleFeaturedStatusService(id);
    if (!result) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Property not found");
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Property ${result.featured ? "set as" : "removed from"} featured successfully`,
        data: result,
    });
}));
const toggleTrendingStatusController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield properties_services_1.propertyServices.toggleTrendingStatusService(id);
    if (!result) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Property not found");
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Property ${result.trending ? "set as" : "removed from"} trending successfully`,
        data: result,
    });
}));
exports.propertyControllers = {
    createPropertyController,
    updatePropertyController,
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
};
