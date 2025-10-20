import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ratingControllers } from "./rating.controllers";
import { ratingValidations } from "./rating.validation";

const router = express.Router();

router.post("/", auth, validateRequest(ratingValidations.createRatingValidation), ratingControllers.createRatingController);

// Property rating routes
router.get("/properties/:propertyId/ratings", ratingControllers.getPropertyRatingsController);

router.get("/properties/:propertyId/rating-stats", ratingControllers.getPropertyRatingStatsController);

router.get("/properties/:propertyId/user-rating", auth, ratingControllers.getUserPropertyRatingController);

// Site rating routes
router.get("/site-ratings", ratingControllers.getSiteRatingsController);

router.get("/site-rating-stats", ratingControllers.getSiteRatingStatsController);

router.get("/site-ratings/user-rating", auth, ratingControllers.getUserSiteRatingController);

// Update and delete routes (only by rating owner or admin)
router.patch("/:ratingId", auth, validateRequest(ratingValidations.updateRatingValidation), ratingControllers.updateRatingController);

router.delete("/:ratingId", auth, ratingControllers.deleteRatingController);

export const ratingRoutes = router;
