import { Router } from "express";
import auth from "../../middlewares/auth";
import { paymentControllers } from "./payment.controllers";

const router = Router();

router.post("/create", auth, paymentControllers.createPayment);
router.post("/confirm", auth, paymentControllers.confirmPayment);
router.get("/my-payments", auth, paymentControllers.getMyPayments);
router.get("/:id", auth, paymentControllers.getPayment);

export const paymentRoutes = router;
