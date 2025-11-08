import express from "express";
import { messageTypesController } from "./messageTypes.controller";
const router = express.Router();

router.post("/", messageTypesController.createMessageType);
router.get("/", messageTypesController.getAllMessageTypes);
router.get("/:id", messageTypesController.getMessageTypeById);
router.get("/type/:type", messageTypesController.getMessageTypeByType);
router.put("/:id", messageTypesController.updateMessageType);
router.delete("/:id", messageTypesController.deleteMessageType);

export const messageTypesRoutes = router;
