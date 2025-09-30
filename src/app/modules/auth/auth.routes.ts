import { Router } from "express";
import { authControllers } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { loginSchema, registerSchema } from "./auth.validation";
import { handleFileOrJson } from "../../../utils/handleFileOrJson";
import auth from "../../middlewares/auth";
const router = Router();

router.post("/register", handleFileOrJson({ fileField: "profile" }), validateRequest(registerSchema), authControllers.register);
router.post("/resend-verify-email", authControllers.resendVerifyEmailController);
router.get("/verify-email", authControllers.verifyEmailController);

router.post("/login", validateRequest(loginSchema), authControllers.login);

router.get("/me", auth, authControllers.getMeController);

router.post("/refresh-token", authControllers.refreshAccessToken);

router.post("/logout", authControllers.logout);

router.post("/forgot-password", authControllers.requestPasswordResetOtpController);
router.post("/verify-otp", authControllers.verifyOtpController);
router.post("/resend-reset-otp", authControllers.resendPasswordResetOtpController);
router.post("/reset-password", authControllers.resetPasswordWithTokenController);

router.post("/change-password", auth, authControllers.changePasswordController);

export const authRoutes = router;
