"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const subscription_controllers_1 = require("./subscription.controllers");
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const auth_interface_1 = require("../auth/auth.interface");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
// Public routes (for frontend to display subscription plans)
router.get("/", subscription_controllers_1.subscriptionController.getAllSubscriptions);
router.get("/admin", subscription_controllers_1.subscriptionController.getAllSubscriptionsAdmin);
router.get("/type/:type", subscription_controllers_1.subscriptionController.getSubscriptionsByType);
router.get("/admin/type/:type", subscription_controllers_1.subscriptionController.getSubscriptionsByTypeForAdmin);
router.get("/type/:type/level/:level", subscription_controllers_1.subscriptionController.getSubscriptionByTypeAndLevel);
router.get("/default/:type", subscription_controllers_1.subscriptionController.getDefaultSubscription);
router.get("/:id", subscription_controllers_1.subscriptionController.getSubscription);
router.delete("/:id", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), subscription_controllers_1.subscriptionController.deleteSubscription);
// Admin only routes
router.post("/", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), subscription_controllers_1.subscriptionController.createSubscription);
router.patch("/:id", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), subscription_controllers_1.subscriptionController.updateSubscription);
router.patch("/:id/toggle-status", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), subscription_controllers_1.subscriptionController.toggleSubscriptionStatus);
// new
router.post("/create-checkout-session", auth_1.default, subscription_controllers_1.subscriptionController.createCheckoutSession);
router.get("/session/:sessionId", auth_1.default, subscription_controllers_1.subscriptionController.getCheckoutSession);
exports.subscriptionRoutes = router;
