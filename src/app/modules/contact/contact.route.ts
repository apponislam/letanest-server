import express from "express";
import { contactControllers } from "./contact.controller";
import { contactDownloader } from "./contactDataDownload";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/", contactControllers.createContact);
router.get("/", contactControllers.getContacts);
router.get("/download-excel", contactDownloader.downloadContactsExcel);
router.get("/:id", contactControllers.getContactById);
router.patch("/:id/status", contactControllers.updateContactStatus);
router.post("/:id/reply", auth, contactControllers.replyToContact);

export const contactRoutes = router;
