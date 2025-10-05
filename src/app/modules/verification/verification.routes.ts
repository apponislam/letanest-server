// routes/verification.routes.ts
import express from "express";
import { verificationController } from "./verification.controller";
import { uploadVerificationFiles } from "./verifyUpload";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorize";
import { roles } from "../auth/auth.interface";

const router = express.Router();
router.post("/submit", auth, uploadVerificationFiles, verificationController.submitVerification);

router.get("/my-verifications", auth, verificationController.getUserVerifications);

router.get("/:id", auth, verificationController.getVerification);

router.delete("/:id", auth, verificationController.deleteVerification);

router.get("/", auth, authorize([roles.ADMIN]), verificationController.getAllVerifications);

router.patch("/:id/status", auth, authorize([roles.ADMIN]), verificationController.updateStatus);

router.get("/:id/files/:fileType", auth, verificationController.serveFile);

export const verificationRoutes = router;
