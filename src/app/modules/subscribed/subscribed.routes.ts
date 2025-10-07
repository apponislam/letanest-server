import express from "express";
import auth from "../../middlewares/auth";
import { userSubscriptionController } from "./subscribed.controllers";

const router = express.Router();

// All routes require authentication
router.use(auth);

// User subscription management
router.post("/", userSubscriptionController.createUserSubscription);
router.get("/my-subscriptions", userSubscriptionController.getMySubscriptions);
router.get("/active", userSubscriptionController.getMyActiveSubscription);
router.get("/:id", userSubscriptionController.getUserSubscription);
router.patch("/:id/cancel", userSubscriptionController.cancelSubscription);
router.patch("/:id/status", userSubscriptionController.updateSubscriptionStatus);

// Webhook (might not need auth depending on your setup)
router.post("/webhook/stripe", userSubscriptionController.handleStripeWebhook);

export const userSubscriptionRoutes = router;
