"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validateRequest_1 = __importDefault(require("../middlewares/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const handleFileOrJson_1 = require("../../utils/handleFileOrJson");
const passport_1 = __importDefault(require("../../utils/passport"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = (0, express_1.Router)();
router.post("/register", (0, handleFileOrJson_1.handleFileOrJson)({ fileField: "profile" }), (0, validateRequest_1.default)(auth_validation_1.registerSchema), auth_controller_1.authControllers.register);
router.post("/resend-verify-email", auth_controller_1.authControllers.resendVerifyEmailController);
router.get("/verify-email", auth_controller_1.authControllers.verifyEmailController);
router.post("/login", (0, validateRequest_1.default)(auth_validation_1.loginSchema), auth_controller_1.authControllers.login);
// Google Sign In
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport_1.default.authenticate("google", { session: false, failureRedirect: "/login" }), auth_controller_1.authControllers.googleCallback);
// Facebook Sign In
router.get("/facebook", passport_1.default.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback", passport_1.default.authenticate("facebook", { session: false }), auth_controller_1.authControllers.facebookCallback);
router.get("/me", auth_1.default, auth_controller_1.authControllers.getMeController);
router.post("/refresh-token", auth_controller_1.authControllers.refreshAccessToken);
router.post("/logout", auth_controller_1.authControllers.logout);
router.post("/forgot-password", auth_controller_1.authControllers.requestPasswordResetOtpController);
router.post("/resend-reset-otp", auth_controller_1.authControllers.resendPasswordResetOtpController);
router.post("/reset-password", auth_controller_1.authControllers.resetPasswordWithOtpController);
router.post("/change-password", auth_1.default, auth_controller_1.authControllers.changePasswordController);
exports.authRoutes = router;
