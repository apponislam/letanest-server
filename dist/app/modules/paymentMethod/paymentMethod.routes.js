"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodRoutes = void 0;
// routes/paymentMethod.routes.ts
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const paymentMethod_controllers_1 = require("./paymentMethod.controllers");
const paymentMethod_1 = require("../../middlewares/paymentMethod");
const router = express_1.default.Router();
router.post("/", auth_1.default, paymentMethod_controllers_1.paymentMethodControllers.createPaymentMethod);
router.get("/", auth_1.default, paymentMethod_controllers_1.paymentMethodControllers.getPaymentMethods);
router.get("/default", auth_1.default, paymentMethod_controllers_1.paymentMethodControllers.getDefaultPaymentMethod);
router.patch("/:paymentMethodId/set-default", auth_1.default, paymentMethod_1.checkPaymentMethodOwnership, paymentMethod_controllers_1.paymentMethodControllers.setDefaultPaymentMethod);
router.delete("/:paymentMethodId", auth_1.default, paymentMethod_1.checkPaymentMethodOwnership, paymentMethod_controllers_1.paymentMethodControllers.deletePaymentMethod);
exports.paymentMethodRoutes = router;
