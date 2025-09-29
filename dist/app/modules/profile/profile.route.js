"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRoute = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const profile_controllers_1 = require("./profile.controllers");
const router = (0, express_1.Router)();
router.put("/update/me", auth_1.default, profile_controllers_1.profileControllers.updateMyProfile);
exports.profileRoute = router;
