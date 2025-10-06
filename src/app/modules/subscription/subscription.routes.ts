// routes/subscription.routes.ts
import express from "express";
import { subscriptionController } from "./subscription.controllers";
import authorize from "../../middlewares/authorize";
import { roles } from "../auth/auth.interface";
import auth from "../../middlewares/auth";

const router = express.Router();

// Public routes (for frontend to display subscription plans)
router.get("/", subscriptionController.getAllSubscriptions);
router.get("/type/:type", subscriptionController.getSubscriptionsByType);
router.get("/:id", subscriptionController.getSubscription);

// Admin only routes
router.post("/", auth, authorize([roles.ADMIN]), subscriptionController.createSubscription);
router.patch("/:id", auth, authorize([roles.ADMIN]), subscriptionController.updateSubscription);
router.delete("/:id", auth, authorize([roles.ADMIN]), subscriptionController.deleteSubscription);
router.patch("/:id/toggle-status", auth, authorize([roles.ADMIN]), subscriptionController.toggleSubscriptionStatus);

export const subscriptionRoutes = router;
