"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const payment_controllers_1 = require("./payment.controllers");
const payment_template_1 = require("./payment.template");
const router = (0, express_1.Router)();
// ADMIN ROUTES
router.get("/admin", auth_1.default, payment_controllers_1.paymentControllers.getAllPayments);
router.get("/admin/totals", auth_1.default, payment_controllers_1.paymentControllers.getPaymentTotals);
router.get("/admin/stats/statistics", auth_1.default, payment_controllers_1.paymentControllers.getPaymentStats);
// router.post("/admin/download-pdf", auth, paymentControllers.downloadPaymentsPDF);
router.post("/admin/download-pdf", auth_1.default, payment_template_1.paymentTemplate.generatePaymentsPDF);
// other routes
router.post("/create", auth_1.default, payment_controllers_1.paymentControllers.createPayment);
router.post("/confirm", auth_1.default, payment_controllers_1.paymentControllers.confirmPayment);
router.get("/my-payments", auth_1.default, payment_controllers_1.paymentControllers.getUserPayments);
router.get("/:id", auth_1.default, payment_controllers_1.paymentControllers.getPayment);
// HOST ROUTES
router.get("/host/my-payments", auth_1.default, payment_controllers_1.paymentControllers.getHostPayments);
router.get("/host/my-payments/invoice/:id", auth_1.default, payment_template_1.paymentTemplate.generateHostSingleInvoicePDF);
router.post("/host/my-payments/payments-report", auth_1.default, payment_template_1.paymentTemplate.generateHostPaymentsPDF);
exports.paymentRoutes = router;
