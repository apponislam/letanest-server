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
exports.PrivacyPolicyController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const privacyPolicy_service_1 = require("./privacyPolicy.service");
const createOrUpdatePrivacyPolicy = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.createOrUpdatePrivacyPolicy(Object.assign(Object.assign({}, req.body), { createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }));
    res.status(http_status_1.default.OK).send({
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Privacy Policy saved successfully",
        data: result,
    });
}));
const getPrivacyPolicy = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.getPrivacyPolicy();
    res.status(http_status_1.default.OK).send({
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Privacy Policy retrieved successfully",
        data: result,
    });
}));
const updatePrivacyPolicy = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.updatePrivacyPolicy(req.body);
    res.status(http_status_1.default.OK).send({
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Privacy Policy updated successfully",
        data: result,
    });
}));
exports.PrivacyPolicyController = {
    createOrUpdatePrivacyPolicy,
    getPrivacyPolicy,
    updatePrivacyPolicy,
};
