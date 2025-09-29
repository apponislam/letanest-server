"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_controllers_1 = require("./user.controllers");
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const auth_interface_1 = require("../auth/auth.interface");
const router = (0, express_1.Router)();
// router.get("/", auth, authorize([roles.ADMIN, roles.SUPER_ADMIN, roles.MODERATOR]), userControllers.getAllUser);
router.get("/", user_controllers_1.userControllers.getAllUsers);
router.get("/:id", user_controllers_1.userControllers.getSingleUser);
router.delete("/delete/me", auth_1.default, user_controllers_1.userControllers.deleteMyAccount);
router.delete("/delete/:id", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), user_controllers_1.userControllers.adminDeleteUser);
exports.userRoutes = router;
