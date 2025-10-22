import express from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorize";
import { roles } from "../auth/auth.interface";
import { pageConfigControllers } from "./pages.controller";
import { uploadPageImage } from "./uploadPageImage";

const router = express.Router();

// Public routes - for frontend to get page configurations
router.get("/:pageType", pageConfigControllers.getPageConfigController);
router.get("/", pageConfigControllers.getAllPageConfigsController);

// Admin only routes - for managing page configurations
router.patch("/:pageType", auth, authorize([roles.ADMIN]), uploadPageImage, pageConfigControllers.updatePageConfigController);

router.delete("/:id", auth, authorize([roles.ADMIN]), pageConfigControllers.deletePageConfigController);

export const pageConfigRoutes = router;
