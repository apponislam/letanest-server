"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyPolicyRoutes = void 0;
const express_1 = require("express");
const privacyPolicy_controller_1 = require("./privacyPolicy.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
router.post("/", auth_1.default, privacyPolicy_controller_1.PrivacyPolicyController.createOrUpdatePrivacyPolicy);
router.get("/", privacyPolicy_controller_1.PrivacyPolicyController.getPrivacyPolicy);
router.patch("/", auth_1.default, privacyPolicy_controller_1.PrivacyPolicyController.updatePrivacyPolicy);
exports.privacyPolicyRoutes = router;
