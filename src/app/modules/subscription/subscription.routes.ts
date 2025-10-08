import express from "express";
import { subscriptionController } from "./subscription.controllers";
import authorize from "../../middlewares/authorize";
import { roles } from "../auth/auth.interface";
import auth from "../../middlewares/auth";

const router = express.Router();

// Public routes (for frontend to display subscription plans)
router.get("/", subscriptionController.getAllSubscriptions);
router.get("/admin", subscriptionController.getAllSubscriptionsAdmin);
router.get("/type/:type", subscriptionController.getSubscriptionsByType);
router.get("/admin/type/:type", subscriptionController.getSubscriptionsByTypeForAdmin);
router.get("/type/:type/level/:level", subscriptionController.getSubscriptionByTypeAndLevel);
router.get("/default/:type", subscriptionController.getDefaultSubscription);
router.get("/:id", subscriptionController.getSubscription);

// Admin only routes
router.post("/", auth, authorize([roles.ADMIN]), subscriptionController.createSubscription);
router.patch("/:id", auth, authorize([roles.ADMIN]), subscriptionController.updateSubscription);
router.patch("/:id/toggle-status", auth, authorize([roles.ADMIN]), subscriptionController.toggleSubscriptionStatus);

// new
router.post("/create-checkout-session", auth, subscriptionController.createCheckoutSession);

router.get("/session/:sessionId", auth, subscriptionController.getCheckoutSession);

export const subscriptionRoutes = router;
