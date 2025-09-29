"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfile = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const rootDir = path_1.default.join(process.cwd(), "uploads", "profile");
if (!fs_1.default.existsSync(rootDir)) {
    fs_1.default.mkdirSync(rootDir, { recursive: true });
}
// const storage = multer.diskStorage({
//     destination: (_req, _file, cb) => {
//         cb(null, rootDir);
//     },
//     filename: (_req, file, cb) => {
//         const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
//         const ext = path.extname(file.originalname);
//         cb(null, uniqueName + ext);
//     },
// });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, rootDir);
    },
    filename: (_req, file, cb) => {
        const isoString = new Date().toISOString(); // 2025-09-10T17:51:38.377Z
        const safeTime = isoString.replace(/:/g, "-").replace(/\./g, "-").replace("Z", "");
        const random = Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${safeTime}-${random}${ext}`);
    },
});
exports.uploadProfile = (0, multer_1.default)({ storage });
