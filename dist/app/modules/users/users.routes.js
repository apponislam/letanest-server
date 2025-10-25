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
const updatePhoto_1 = require("./updatePhoto");
const router = express_1.default.Router();
router.get("/", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), users_controllers_1.userControllers.getAllUsersController);
// Get single user
router.get("/:id", auth_1.default, users_controllers_1.userControllers.getSingleUserController);
router.patch("/profile", auth_1.default, updatePhoto_1.uploadProfileImage, users_controllers_1.userControllers.updateUserProfileController);
router.get("/me/subscriptions", auth_1.default, users_controllers_1.userControllers.getMySubscriptionsController);
// ONLY THIS NEW ROUTE
router.post("/me/free-tier/activate", auth_1.default, users_controllers_1.userControllers.activateFreeTierController);
// Stripe Connect Routes (Host only)
router.post("/stripe/connect", auth_1.default, users_controllers_1.userControllers.connectStripeAccountController);
router.get("/stripe/status", auth_1.default, users_controllers_1.userControllers.getStripeAccountStatusController);
router.get("/stripe/dashboard", auth_1.default, users_controllers_1.userControllers.getStripeDashboardController);
router.post("/stripe/disconnect", auth_1.default, users_controllers_1.userControllers.disconnectStripeAccountController);
// get me
router.get("/me/profile", auth_1.default, users_controllers_1.userControllers.getMyProfileController);
router.get("/random/admin", auth_1.default, users_controllers_1.userControllers.getRandomAdminController);
exports.userRoutes = router;
