"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFormDataJson = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const parseFormDataJson = (fieldName = "data") => {
    return (req, res, next) => {
        try {
            if (req.body[fieldName]) {
                const jsonData = JSON.parse(req.body[fieldName]);
                req.body = Object.assign(Object.assign({}, req.body), jsonData);
                delete req.body[fieldName];
            }
            next();
        }
        catch (error) {
            const errorMessage = "Invalid JSON data format";
            const apiError = new ApiError_1.default(http_status_1.default.BAD_REQUEST, errorMessage);
            next(apiError);
        }
    };
};
exports.parseFormDataJson = parseFormDataJson;
