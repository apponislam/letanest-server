import multer, { FileFilterCallback } from "multer";
import { NextFunction, Request, Response } from "express";
import path from "path";
import fs from "fs";
import ApiError from "../../errors/ApiError";

// Create upload directory in root
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "photos");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    // console.log(`Created upload directory: ${UPLOAD_DIR}`);
} else {
    // console.log(`Upload directory exists: ${UPLOAD_DIR}`);
}

// Storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(`Processing file: ${file.originalname}`);
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const filename = `${uniqueSuffix}${ext}`;
        console.log(`Generated filename: ${filename} for ${file.originalname}`);
        cb(null, filename);
    },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    console.log(`File MIME type: ${file.mimetype}`);

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.log(`Rejected file type: ${file.mimetype}`);
        cb(new Error(`Invalid file type. Only ${allowedTypes.join(", ")} are allowed`));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024,
        files: 21,
    },
});

// Enhanced middleware with error handling using ApiError
export const uploadPropertyFiles = (req: Request, res: Response, next: NextFunction) => {
    // console.log("Upload middleware called");
    // console.log("Request headers:", req.headers["content-type"]);

    const uploadMiddleware = upload.fields([
        { name: "coverPhoto", maxCount: 1 },
        { name: "photos", maxCount: 20 },
    ]);

    uploadMiddleware(req, res, (err: any) => {
        if (err) {
            console.error("Multer upload error:", err);

            let errorMessage = err.message;
            let statusCode = 400;

            if (err.code === "LIMIT_FILE_SIZE") {
                errorMessage = "File too large. Maximum size is 15MB.";
            } else if (err.code === "LIMIT_FILE_COUNT") {
                errorMessage = "Too many files. Maximum 20 photos allowed.";
            } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
                errorMessage = 'Unexpected file field. Use "coverPhoto" and "photos" only.';
            }
            return next(new ApiError(statusCode, errorMessage));
        }

        // Log uploaded files
        console.log("Uploaded files:", req.files);

        // Check if files were actually uploaded
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (files) {
            Object.keys(files).forEach((fieldName) => {
                files[fieldName].forEach((file) => {
                    const filePath = path.join(UPLOAD_DIR, file.filename);
                    const fileExists = fs.existsSync(filePath);
                    console.log(`File ${file.filename} exists: ${fileExists}, Path: ${filePath}`);

                    if (!fileExists) {
                        console.warn(`⚠️ File was not written to disk: ${filePath}`);
                    }
                });
            });
        } else {
            console.log("No files found in request");
        }

        next();
    });
};
