"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const auth_interface_1 = require("../auth/auth.interface");
const reposts_controller_1 = require("./reposts.controller");
const router = express_1.default.Router();
// Guest routes
router.post("/", auth_1.default, reposts_controller_1.reportControllers.createReportController);
router.get("/my-reports", auth_1.default, reposts_controller_1.reportControllers.getMyReportsController);
// Admin routes
router.get("/", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), reposts_controller_1.reportControllers.getAllReportsController);
router.get("/stats", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), reposts_controller_1.reportControllers.getReportStatsController);
router.patch("/:reportId/status", auth_1.default, (0, authorize_1.default)([auth_interface_1.roles.ADMIN]), reposts_controller_1.reportControllers.updateReportStatusController);
// Host can see reports against them
router.get("/host/:hostId", auth_1.default, reposts_controller_1.reportControllers.getHostReportsController);
exports.reportRoutes = router;
