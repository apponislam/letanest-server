"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Unauthorized"));
        }
        const userRole = req.user.role; // TS now knows user exists
        if (!userRole || !allowedRoles.includes(userRole)) {
            return next(new ApiError_1.default(http_status_1.default.FORBIDDEN, "Forbidden"));
        }
        next();
    };
};
exports.default = authorize;
