"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.peaceOfMindFeeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const peaceOfMindFee_controllers_1 = require("./peaceOfMindFee.controllers");
const router = express_1.default.Router();
router.post("/", auth_1.default, peaceOfMindFee_controllers_1.peaceOfMindFeeControllers.createOrUpdateFee);
router.get("/", peaceOfMindFee_controllers_1.peaceOfMindFeeControllers.getFee);
exports.peaceOfMindFeeRoutes = router;
