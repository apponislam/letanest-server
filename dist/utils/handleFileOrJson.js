"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFileOrJson = void 0;
const uploadProfile_1 = require("../app/middlewares/uploadProfile");
const parseFormData_1 = require("./parseFormData");
const handleFileOrJson = (options = {}) => {
    const { fileField, multiple = false, maxCount = 10, jsonField = "data" } = options;
    return (req, res, next) => {
        const contentType = req.headers["content-type"] || "";
        if (contentType.startsWith("multipart/form-data") && fileField) {
            const uploadFn = multiple ? uploadProfile_1.uploadProfile.array(fileField, maxCount) : uploadProfile_1.uploadProfile.single(fileField);
            uploadFn(req, res, (err) => {
                if (err) {
                    console.error("File upload error:", err);
                    return next(err);
                }
                // Check if JSON field exists and needs parsing - SAFELY
                if (req.body && typeof req.body === "object" && req.body[jsonField] !== undefined) {
                    (0, parseFormData_1.parseFormDataJson)(jsonField)(req, res, next);
                }
                else {
                    next();
                }
            });
        }
        else {
            // For raw JSON or other content types, skip file processing
            next();
        }
    };
};
exports.handleFileOrJson = handleFileOrJson;
