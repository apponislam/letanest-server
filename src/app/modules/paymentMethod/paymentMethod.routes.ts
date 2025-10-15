// routes/paymentMethod.routes.ts
import express from "express";
import auth from "../../middlewares/auth";
import { paymentMethodControllers } from "./paymentMethod.controllers";
import { checkPaymentMethodOwnership } from "../../middlewares/paymentMethod";

const router = express.Router();

router.post("/", auth, paymentMethodControllers.createPaymentMethod);

router.get("/", auth, paymentMethodControllers.getPaymentMethods);

router.get("/default", auth, paymentMethodControllers.getDefaultPaymentMethod);

router.patch("/:paymentMethodId/set-default", auth, checkPaymentMethodOwnership, paymentMethodControllers.setDefaultPaymentMethod);

router.delete("/:paymentMethodId", auth, checkPaymentMethodOwnership, paymentMethodControllers.deletePaymentMethod);

export const paymentMethodRoutes = router;
