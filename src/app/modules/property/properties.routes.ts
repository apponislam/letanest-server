import express from "express";
import { propertyControllers } from "./properties.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorize";
import { uploadPropertyFiles } from "../../middlewares/propertyPhotos";

const router = express.Router();

router.post("/", auth, authorize(["ADMIN", "HOST"]), uploadPropertyFiles, propertyControllers.createPropertyController);

router.put("/:id", auth, authorize(["ADMIN", "HOST"]), uploadPropertyFiles, propertyControllers.updatePropertyController);

// Anyone authenticated can view single property
router.get("/:id", auth, propertyControllers.getSinglePropertyController);

// Listing with pagination, search, filter
router.get("/", auth, propertyControllers.getAllPropertiesController);

router.get("/admin/all", auth, authorize(["ADMIN"]), propertyControllers.getAllPropertiesForAdminController);

router.patch("/:id/status", auth, authorize(["ADMIN"]), propertyControllers.changePropertyStatusController);

export const propertyRoutes = router;
