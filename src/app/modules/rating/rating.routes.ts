import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ratingControllers } from "./rating.controllers";
import { ratingValidations } from "./rating.validation";

const router = express.Router();

// Create rating
router.post("/", auth, validateRequest(ratingValidations.createRatingValidation), ratingControllers.createRatingController);

// Property rating routes
router.get("/properties/:propertyId/ratings", ratingControllers.getPropertyRatingsController);
router.get("/properties/:propertyId/rating-stats", ratingControllers.getPropertyRatingStatsController);
router.get("/properties/:propertyId/user-rating", auth, ratingControllers.getUserPropertyRatingController);

// Host rating routes
router.get("/hosts/:hostId/ratings", ratingControllers.getHostRatingsController);
router.get("/hosts/:hostId/rating-stats", ratingControllers.getHostRatingStatsController);
router.get("/hosts/:hostId/user-ratings", auth, ratingControllers.getUserHostRatingsController);

// Site rating routes
router.get("/site-ratings", ratingControllers.getSiteRatingsController);
router.get("/site-rating-stats", ratingControllers.getSiteRatingStatsController);
router.get("/site-ratings/user-rating", auth, ratingControllers.getUserSiteRatingController);

// Update and delete routes
router.patch("/:ratingId", auth, validateRequest(ratingValidations.updateRatingValidation), ratingControllers.updateRatingController);
router.delete("/:ratingId", auth, ratingControllers.deleteRatingController);

// ADMIN ONLY ROUTES
router.get("/admin/all-ratings", auth, ratingControllers.getAllRatingsForAdminController);
router.get("/admin/rating-stats", auth, ratingControllers.getAdminRatingStatsController);
router.patch("/admin/:ratingId/status", auth, ratingControllers.updateRatingStatusController);

// Check user ratings
router.post("/check-user-ratings", auth, ratingControllers.checkUserPropertiesRatingController);

export const ratingRoutes = router;
