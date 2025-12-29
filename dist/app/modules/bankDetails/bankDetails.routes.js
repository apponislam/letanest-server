"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bankDetailsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const bankDetails_controllers_1 = require("./bankDetails.controllers");
const router = express_1.default.Router();
router.post("/", auth_1.default, bankDetails_controllers_1.bankDetailsControllers.createBankDetails);
router.get("/", auth_1.default, bankDetails_controllers_1.bankDetailsControllers.getMyBankDetails);
router.get("/user/:userId", bankDetails_controllers_1.bankDetailsControllers.getBankDetailsByUserId);
router.patch("/", auth_1.default, bankDetails_controllers_1.bankDetailsControllers.updateMyBankDetails);
router.delete("/", auth_1.default, bankDetails_controllers_1.bankDetailsControllers.deleteMyBankDetails);
exports.bankDetailsRoutes = router;
