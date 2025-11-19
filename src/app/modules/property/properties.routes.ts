import express from "express";
import { propertyControllers } from "./properties.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorize";
import { uploadPropertyFiles } from "../../middlewares/propertyPhotos";
import { checkPropertyListingLimit } from "./checkPropertyListingLimit";

const router = express.Router();

router.post("/", auth, authorize(["ADMIN", "HOST"]), checkPropertyListingLimit, uploadPropertyFiles, propertyControllers.createPropertyController);

router.put("/:id", auth, authorize(["ADMIN", "HOST"]), uploadPropertyFiles, propertyControllers.updatePropertyController);

router.patch("/:id/refresh-nearby-places", propertyControllers.refreshNearbyPlacesController);

// Anyone authenticated can view single property
router.get("/:id", propertyControllers.getSinglePropertyController);

// Listing with pagination, search, filter
router.get("/", propertyControllers.getAllPropertiesController);

router.get("/admin/published", propertyControllers.getAllPublishedPropertiesController);

router.get("/admin/all", auth, authorize(["ADMIN"]), propertyControllers.getAllNonPublishedPropertiesController);

router.patch("/:id/toggle-featured", auth, authorize(["ADMIN"]), propertyControllers.toggleFeaturedStatusController);
router.patch("/:id/toggle-trending", auth, authorize(["ADMIN"]), propertyControllers.toggleTrendingStatusController);
router.patch("/:id/status", auth, authorize(["ADMIN"]), propertyControllers.changePropertyStatusController);
router.patch("/:id/calendar", auth, authorize(["ADMIN", "HOST"]), propertyControllers.toggleCalendarController);

// Host

router.get("/host/my-properties", auth, propertyControllers.getHostProperties);

router.delete("/host/my-properties/:id", auth, propertyControllers.deleteHostProperty);

router.get("/host/my-published-properties", auth, propertyControllers.getMyPublishedPropertiesController);

router.get("/host/search-published-properties", auth, propertyControllers.searchMyPublishedPropertiesController);

router.get("/property/max-price", propertyControllers.getMaxRoundedPriceController);

export const propertyRoutes = router;
