"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImage = void 0;
// middleware/multer.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const profileUploadDir = "uploads/profile";
if (!fs_1.default.existsSync(profileUploadDir)) {
    fs_1.default.mkdirSync(profileUploadDir, { recursive: true });
}
const profileStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, "profile-" + uniqueSuffix + ext);
    },
});
const profileFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed"));
    }
};
exports.uploadProfileImage = (0, multer_1.default)({
    storage: profileStorage,
    fileFilter: profileFileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
}).single("profileImg");
