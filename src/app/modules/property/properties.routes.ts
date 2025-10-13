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

router.get("/admin/published", auth, authorize(["ADMIN"]), propertyControllers.getAllPublishedPropertiesController);

router.get("/admin/all", auth, authorize(["ADMIN"]), propertyControllers.getAllNonPublishedPropertiesController);

router.patch("/:id/status", auth, authorize(["ADMIN"]), propertyControllers.changePropertyStatusController);

// Host

router.get("/host/my-properties", auth, propertyControllers.getHostProperties);

router.delete("/host/my-properties/:id", auth, propertyControllers.deleteHostProperty);

router.get("/host/my-published-properties", auth, propertyControllers.getMyPublishedPropertiesController);

export const propertyRoutes = router;
