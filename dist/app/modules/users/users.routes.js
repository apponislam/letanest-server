"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const users_controllers_1 = require("./users.controllers");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const auth_interface_1 = require("../auth/auth.interface");
const router = express_1.default.Router();
router.get("/", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), users_controllers_1.userControllers.getAllUsersController);
// ✅ Admin-only: Get single user
router.get("/:id", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), users_controllers_1.userControllers.getSingleUserController);
exports.userRoutes = router;
