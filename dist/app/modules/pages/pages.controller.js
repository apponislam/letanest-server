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
exports.pageConfigControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const pages_services_1 = require("./pages.services");
const getPageConfigController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pageType } = req.params;
    if (pageType !== "signin" && pageType !== "signup") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid page type. Must be signin or signup");
    }
    const config = yield pages_services_1.pageConfigServices.getPageConfigService(pageType);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Page configuration retrieved successfully",
        data: config,
    });
}));
const getAllPageConfigsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const configs = yield pages_services_1.pageConfigServices.getAllPageConfigsService();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All page configurations retrieved successfully",
        data: configs,
    });
}));
// Updated: Handle file upload
const updatePageConfigController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pageType } = req.params;
    if (pageType !== "signin" && pageType !== "signup") {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid page type. Must be signin or signup");
    }
    const updateData = {
        title: req.body.title,
        logo: req.body.logo, // This will be overwritten if a file is uploaded
        isActive: req.body.isActive,
    };
    const logoFile = req.file; // Get the uploaded file
    const updatedConfig = yield pages_services_1.pageConfigServices.upsertPageConfigService(pageType, updateData, logoFile);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Page configuration updated successfully",
        data: updatedConfig,
    });
}));
const deletePageConfigController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield pages_services_1.pageConfigServices.deletePageConfigService(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Page configuration deleted successfully",
        data: null,
    });
}));
exports.pageConfigControllers = {
    getPageConfigController,
    getAllPageConfigsController,
    updatePageConfigController,
    deletePageConfigController,
};
