import express from "express";
import auth from "../../middlewares/auth";
import { userSubscriptionController } from "./subscribed.controllers";

const router = express.Router();

// User subscription management
router.post("/", auth, userSubscriptionController.createUserSubscription);
router.get("/my-subscriptions", auth, userSubscriptionController.getMySubscriptions);
router.get("/active", auth, userSubscriptionController.getMyActiveSubscription);
router.get("/:id", auth, userSubscriptionController.getUserSubscription);
router.patch("/:id/cancel", auth, userSubscriptionController.cancelSubscription);
router.patch("/:id/status", auth, userSubscriptionController.updateSubscriptionStatus);

// Webhook (might not need auth depending on your setup)
// router.post("/webhook/stripe", userSubscriptionController.handleStripeWebhook);

export const userSubscriptionRoutes = router;
