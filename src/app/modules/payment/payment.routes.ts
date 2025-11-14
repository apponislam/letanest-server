import { Router } from "express";
import auth from "../../middlewares/auth";
import { paymentControllers } from "./payment.controllers";
import { paymentTemplate } from "./payment.template";

const router = Router();

// ADMIN ROUTES
router.get("/admin", auth, paymentControllers.getAllPayments);
router.get("/admin/totals", auth, paymentControllers.getPaymentTotals);
router.get("/admin/stats/statistics", auth, paymentControllers.getPaymentStats);
router.post("/admin/download-pdf", auth, paymentTemplate.generatePaymentsPDF);

// other routes
router.post("/create", auth, paymentControllers.createPayment);
router.post("/confirm", auth, paymentControllers.confirmPayment);

//BOOKING FEE ROUTES
router.post("/create-booking-fee", auth, paymentControllers.createBookingFeePayment);
router.post("/confirm-booking-fee", auth, paymentControllers.confirmBookingFeePayment);

router.get("/my-payments", auth, paymentControllers.getUserPayments);
router.get("/:id", auth, paymentControllers.getPayment);

// HOST ROUTES
router.get("/host/my-payments", auth, paymentControllers.getHostPayments);
router.get("/host/my-payments/invoice/:id", auth, paymentTemplate.generateHostSingleInvoicePDF);
router.post("/host/my-payments/payments-report", auth, paymentTemplate.generateHostPaymentsPDF);

router.get("/property/:propertyId", auth, paymentControllers.getPaymentsByProperty);

export const paymentRoutes = router;
