import { Router } from "express";
import auth from "../../middlewares/auth";
import { dashboardControllers } from "./dashboard.controllers";

const router = Router();

router.get("/stats", auth, dashboardControllers.getDashboardStats);
router.get("/revenue-chart", auth, dashboardControllers.getRevenueChartData);
router.get("/property-status", auth, dashboardControllers.getPropertyStatusStats);

export const dashboardRoutes = router;
