"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const dashboard_controllers_1 = require("./dashboard.controllers");
const router = (0, express_1.Router)();
router.get("/stats", auth_1.default, dashboard_controllers_1.dashboardControllers.getDashboardStats);
router.get("/revenue-chart", auth_1.default, dashboard_controllers_1.dashboardControllers.getRevenueChartData);
router.get("/property-status", auth_1.default, dashboard_controllers_1.dashboardControllers.getPropertyStatusStats);
router.get("/site-stats", dashboard_controllers_1.dashboardControllers.getSiteStats);
exports.dashboardRoutes = router;
