"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSubscriptionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const subscribed_controllers_1 = require("./subscribed.controllers");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.default);
// User subscription management
router.post("/", subscribed_controllers_1.userSubscriptionController.createUserSubscription);
router.get("/my-subscriptions", subscribed_controllers_1.userSubscriptionController.getMySubscriptions);
router.get("/active", subscribed_controllers_1.userSubscriptionController.getMyActiveSubscription);
router.get("/:id", subscribed_controllers_1.userSubscriptionController.getUserSubscription);
router.patch("/:id/cancel", subscribed_controllers_1.userSubscriptionController.cancelSubscription);
router.patch("/:id/status", subscribed_controllers_1.userSubscriptionController.updateSubscriptionStatus);
// Webhook (might not need auth depending on your setup)
router.post("/webhook/stripe", subscribed_controllers_1.userSubscriptionController.handleStripeWebhook);
exports.userSubscriptionRoutes = router;
