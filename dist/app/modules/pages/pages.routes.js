"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageConfigRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const auth_interface_1 = require("../auth/auth.interface");
const pages_controller_1 = require("./pages.controller");
const uploadPageImage_1 = require("./uploadPageImage");
const router = express_1.default.Router();
// Public routes - for frontend to get page configurations
router.get("/:pageType", pages_controller_1.pageConfigControllers.getPageConfigController);
router.get("/", pages_controller_1.pageConfigControllers.getAllPageConfigsController);
// Admin only routes - for managing page configurations
router.patch("/:pageType", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), uploadPageImage_1.uploadPageImage, pages_controller_1.pageConfigControllers.updatePageConfigController);
router.delete("/:id", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), pages_controller_1.pageConfigControllers.deletePageConfigController);
exports.pageConfigRoutes = router;
