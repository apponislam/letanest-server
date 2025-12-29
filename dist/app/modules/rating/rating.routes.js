"use strict";
// import express from "express";
// import auth from "../../middlewares/auth";
// import validateRequest from "../../middlewares/validateRequest";
// import { ratingControllers } from "./rating.controllers";
// import { ratingValidations } from "./rating.validation";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingRoutes = void 0;
// const router = express.Router();
// // Create rating
// router.post("/", auth, validateRequest(ratingValidations.createRatingValidation), ratingControllers.createRatingController);
// // Property rating routes
// router.get("/properties/:propertyId/ratings", ratingControllers.getPropertyRatingsController);
// router.get("/properties/:propertyId/rating-stats", ratingControllers.getPropertyRatingStatsController);
// router.get("/properties/:propertyId/user-rating", auth, ratingControllers.getUserPropertyRatingController);
// // Host rating routes
// router.get("/hosts/:hostId/ratings", ratingControllers.getHostRatingsController);
// router.get("/hosts/:hostId/rating-stats", ratingControllers.getHostRatingStatsController);
// router.get("/hosts/:hostId/user-ratings", auth, ratingControllers.getUserHostRatingsController);
// // Site rating routes
// router.get("/site-ratings", ratingControllers.getSiteRatingsController);
// router.get("/site-rating-stats", ratingControllers.getSiteRatingStatsController);
// router.get("/site-ratings/user-rating", auth, ratingControllers.getUserSiteRatingController);
// // Update and delete routes
// router.patch("/:ratingId", auth, validateRequest(ratingValidations.updateRatingValidation), ratingControllers.updateRatingController);
// router.delete("/:ratingId", auth, ratingControllers.deleteRatingController);
// // ADMIN ONLY ROUTES
// router.get("/admin/all-ratings", auth, ratingControllers.getAllRatingsForAdminController);
// router.get("/admin/rating-stats", auth, ratingControllers.getAdminRatingStatsController);
// router.patch("/admin/:ratingId/status", auth, ratingControllers.updateRatingStatusController);
// // Check user ratings
// router.post("/check-user-ratings", auth, ratingControllers.checkUserPropertiesRatingController);
// export const ratingRoutes = router;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rating_controllers_1 = require("./rating.controllers");
const rating_validation_1 = require("./rating.validation");
const router = express_1.default.Router();
// Create rating
router.post("/", auth_1.default, (0, validateRequest_1.default)(rating_validation_1.ratingValidations.createRatingValidation), rating_controllers_1.ratingControllers.createRatingController);
// Property rating routes
router.get("/properties/:propertyId/ratings", rating_controllers_1.ratingControllers.getPropertyRatingsController);
router.get("/properties/:propertyId/rating-stats", rating_controllers_1.ratingControllers.getPropertyRatingStatsController);
router.get("/properties/:propertyId/user-rating", auth_1.default, rating_controllers_1.ratingControllers.getUserPropertyRatingController);
// User rating routes (for both hosts and guests)
router.get("/users/:userId/ratings", rating_controllers_1.ratingControllers.getUserRatingsController);
router.get("/users/:userId/rating-stats", rating_controllers_1.ratingControllers.getUserRatingStatsController);
router.get("/users/:userId/my-ratings", auth_1.default, rating_controllers_1.ratingControllers.getUserRatingsForReviewedController);
// Site rating routes
router.get("/site-ratings", rating_controllers_1.ratingControllers.getSiteRatingsController);
router.get("/site-rating-stats", rating_controllers_1.ratingControllers.getSiteRatingStatsController);
router.get("/site-ratings/user-rating", auth_1.default, rating_controllers_1.ratingControllers.getUserSiteRatingController);
// Update and delete routes
router.patch("/:ratingId", auth_1.default, (0, validateRequest_1.default)(rating_validation_1.ratingValidations.updateRatingValidation), rating_controllers_1.ratingControllers.updateRatingController);
router.delete("/:ratingId", auth_1.default, rating_controllers_1.ratingControllers.deleteRatingController);
// ADMIN ONLY ROUTES
router.get("/admin/all-ratings", auth_1.default, rating_controllers_1.ratingControllers.getAllRatingsForAdminController);
router.get("/admin/rating-stats", auth_1.default, rating_controllers_1.ratingControllers.getAdminRatingStatsController);
router.patch("/admin/:ratingId/status", auth_1.default, (0, validateRequest_1.default)(rating_validation_1.ratingValidations.updateRatingStatusValidation), rating_controllers_1.ratingControllers.updateRatingStatusController);
// Check user ratings
router.post("/check-user-ratings", auth_1.default, rating_controllers_1.ratingControllers.checkUserPropertiesRatingController);
exports.ratingRoutes = router;
