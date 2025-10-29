import express from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorize";
import { roles } from "../auth/auth.interface";
import { reportControllers } from "./reposts.controller";

const router = express.Router();

router.post("/", auth, reportControllers.createReportController);
router.get("/my-reports", auth, reportControllers.getMyReportsController);
router.get("/reports-against-me", auth, reportControllers.getReportsAgainstMeController);

// Admin routes
router.get("/", auth, authorize([roles.ADMIN]), reportControllers.getAllReportsController);
router.get("/stats", auth, authorize([roles.ADMIN]), reportControllers.getReportStatsController);
router.patch("/:reportId/status", auth, authorize([roles.ADMIN]), reportControllers.updateReportStatusController);

export const reportRoutes = router;
