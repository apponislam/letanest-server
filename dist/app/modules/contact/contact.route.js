"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRoutes = void 0;
const express_1 = __importDefault(require("express"));
const contact_controller_1 = require("./contact.controller");
const router = express_1.default.Router();
router.post("/", contact_controller_1.contactControllers.createContact);
router.get("/", contact_controller_1.contactControllers.getContacts);
router.get("/:id", contact_controller_1.contactControllers.getContactById);
router.patch("/:id/status", contact_controller_1.contactControllers.updateContactStatus);
exports.contactRoutes = router;
