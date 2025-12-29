"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPropertyFiles = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
// Create upload directory in root
const UPLOAD_DIR = path_1.default.join(process.cwd(), "uploads", "photos");
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
    // console.log(`Created upload directory: ${UPLOAD_DIR}`);
}
else {
    // console.log(`Upload directory exists: ${UPLOAD_DIR}`);
}
// Storage config
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        console.log(`Processing file: ${file.originalname}`);
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname);
        const filename = `${uniqueSuffix}${ext}`;
        console.log(`Generated filename: ${filename} for ${file.originalname}`);
        cb(null, filename);
    },
});
// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    console.log(`File MIME type: ${file.mimetype}`);
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        console.log(`Rejected file type: ${file.mimetype}`);
        cb(new Error(`Invalid file type. Only ${allowedTypes.join(", ")} are allowed`));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024,
        files: 21,
    },
});
// Enhanced middleware with error handling using ApiError
const uploadPropertyFiles = (req, res, next) => {
    // console.log("Upload middleware called");
    // console.log("Request headers:", req.headers["content-type"]);
    const uploadMiddleware = exports.upload.fields([
        { name: "coverPhoto", maxCount: 1 },
        { name: "photos", maxCount: 20 },
    ]);
    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error("Multer upload error:", err);
            let errorMessage = err.message;
            let statusCode = 400;
            if (err.code === "LIMIT_FILE_SIZE") {
                errorMessage = "File too large. Maximum size is 15MB.";
            }
            else if (err.code === "LIMIT_FILE_COUNT") {
                errorMessage = "Too many files. Maximum 20 photos allowed.";
            }
            else if (err.code === "LIMIT_UNEXPECTED_FILE") {
                errorMessage = 'Unexpected file field. Use "coverPhoto" and "photos" only.';
            }
            return next(new ApiError_1.default(statusCode, errorMessage));
        }
        // Log uploaded files
        console.log("Uploaded files:", req.files);
        // Check if files were actually uploaded
        const files = req.files;
        if (files) {
            Object.keys(files).forEach((fieldName) => {
                files[fieldName].forEach((file) => {
                    const filePath = path_1.default.join(UPLOAD_DIR, file.filename);
                    const fileExists = fs_1.default.existsSync(filePath);
                    console.log(`File ${file.filename} exists: ${fileExists}, Path: ${filePath}`);
                    if (!fileExists) {
                        console.warn(`⚠️ File was not written to disk: ${filePath}`);
                    }
                });
            });
        }
        else {
            console.log("No files found in request");
        }
        next();
    });
};
exports.uploadPropertyFiles = uploadPropertyFiles;
