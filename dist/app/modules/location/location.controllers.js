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
exports.locationControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const location_services_1 = require("./location.services");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const createLocation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const location = yield location_services_1.locationServices.createLocation(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Location created successfully",
        data: location,
    });
}));
const getAllLocations = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, isActive, page = 1, limit = 10, sortBy = "name", sortOrder = "asc" } = req.query;
    const filters = {
        search: search,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy,
        sortOrder: sortOrder,
    };
    const result = yield location_services_1.locationServices.getAllLocations(filters);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Locations fetched successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getLocationById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { locationId } = req.params;
    const location = yield location_services_1.locationServices.getLocationById(locationId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Location fetched successfully",
        data: location,
    });
}));
const updateLocation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { locationId } = req.params;
    const location = yield location_services_1.locationServices.updateLocation(locationId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Location updated successfully",
        data: location,
    });
}));
const deleteLocation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { locationId } = req.params;
    const location = yield location_services_1.locationServices.deleteLocation(locationId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Location deleted successfully",
        data: location,
    });
}));
const searchLocations = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const locations = yield location_services_1.locationServices.searchLocations(search);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Locations searched successfully",
        data: locations,
    });
}));
exports.locationControllers = {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocation,
    deleteLocation,
    searchLocations,
};
