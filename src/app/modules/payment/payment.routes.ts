import { Router } from "express";
import auth from "../../middlewares/auth";
import { paymentControllers } from "./payment.controllers";

const router = Router();

// ADMIN ROUTES
router.get("/admin", auth, paymentControllers.getAllPayments);
router.get("/admin/totals", auth, paymentControllers.getPaymentTotals);
router.get("/admin/stats/statistics", auth, paymentControllers.getPaymentStats);

// other routes
router.post("/create", auth, paymentControllers.createPayment);
router.post("/confirm", auth, paymentControllers.confirmPayment);
router.get("/my-payments", auth, paymentControllers.getMyPayments);
router.get("/:id", auth, paymentControllers.getPayment);

export const paymentRoutes = router;
