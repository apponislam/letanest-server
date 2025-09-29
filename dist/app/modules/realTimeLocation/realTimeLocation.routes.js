"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.realTimeLocationRoutes = void 0;
const express_1 = require("express");
const realTimeLocation_controller_1 = require("./realTimeLocation.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
router.post("/update", auth_1.default, realTimeLocation_controller_1.realtimeLocationControllers.updateMyLocation);
router.patch("/toggle-hide", auth_1.default, realTimeLocation_controller_1.realtimeLocationControllers.toggleHideLocation);
exports.realTimeLocationRoutes = router;
