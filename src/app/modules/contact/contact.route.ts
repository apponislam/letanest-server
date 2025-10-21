import express from "express";
import { contactControllers } from "./contact.controller";

const router = express.Router();

router.post("/", contactControllers.createContact);
router.get("/", contactControllers.getContacts);
router.get("/:id", contactControllers.getContactById);
router.patch("/:id/status", contactControllers.updateContactStatus);

export const contactRoutes = router;
