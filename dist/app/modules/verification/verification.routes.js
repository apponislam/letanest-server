"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationRoutes = void 0;
// routes/verification.routes.ts
const express_1 = __importDefault(require("express"));
const verification_controller_1 = require("./verification.controller");
const verifyUpload_1 = require("./verifyUpload");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const auth_interface_1 = require("../auth/auth.interface");
const router = express_1.default.Router();
router.post("/submit", auth_1.default, verifyUpload_1.uploadVerificationFiles, verification_controller_1.verificationController.submitVerification);
router.get("/my-verifications", auth_1.default, verification_controller_1.verificationController.getUserVerifications);
router.get("/:id", auth_1.default, verification_controller_1.verificationController.getVerification);
router.delete("/:id", auth_1.default, verification_controller_1.verificationController.deleteVerification);
router.get("/", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), verification_controller_1.verificationController.getAllVerifications);
router.patch("/:id/status", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), verification_controller_1.verificationController.updateStatus);
router.get("/:id/files/:fileType", auth_1.default, verification_controller_1.verificationController.serveFile);
exports.verificationRoutes = router;
