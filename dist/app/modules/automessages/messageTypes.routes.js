"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageTypesRoutes = void 0;
const express_1 = __importDefault(require("express"));
const messageTypes_controller_1 = require("./messageTypes.controller");
const router = express_1.default.Router();
router.post("/", messageTypes_controller_1.messageTypesController.createMessageType);
router.get("/", messageTypes_controller_1.messageTypesController.getAllMessageTypes);
router.get("/:id", messageTypes_controller_1.messageTypesController.getMessageTypeById);
router.get("/type/:type", messageTypes_controller_1.messageTypesController.getMessageTypeByType);
router.put("/:id", messageTypes_controller_1.messageTypesController.updateMessageType);
router.delete("/:id", messageTypes_controller_1.messageTypesController.deleteMessageType);
exports.messageTypesRoutes = router;
