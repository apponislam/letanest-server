"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingRoutes = void 0;
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
// Host rating routes (NEW)
router.get("/hosts/:hostId/ratings", rating_controllers_1.ratingControllers.getHostRatingsController);
router.get("/hosts/:hostId/rating-stats", rating_controllers_1.ratingControllers.getHostRatingStatsController);
router.get("/hosts/:hostId/user-ratings", auth_1.default, rating_controllers_1.ratingControllers.getUserHostRatingsController);
// Site rating routes
router.get("/site-ratings", rating_controllers_1.ratingControllers.getSiteRatingsController);
router.get("/site-rating-stats", rating_controllers_1.ratingControllers.getSiteRatingStatsController);
router.get("/site-ratings/user-rating", auth_1.default, rating_controllers_1.ratingControllers.getUserSiteRatingController);
// Update and delete routes (only by rating owner or admin)
router.patch("/:ratingId", auth_1.default, (0, validateRequest_1.default)(rating_validation_1.ratingValidations.updateRatingValidation), rating_controllers_1.ratingControllers.updateRatingController);
router.delete("/:ratingId", auth_1.default, rating_controllers_1.ratingControllers.deleteRatingController);
// ADMIN ONLY ROUTES
router.get("/admin/all-ratings", auth_1.default, rating_controllers_1.ratingControllers.getAllRatingsForAdminController);
router.get("/admin/rating-stats", auth_1.default, rating_controllers_1.ratingControllers.getAdminRatingStatsController);
router.post("/check-user-ratings", auth_1.default, rating_controllers_1.ratingControllers.checkUserPropertiesRatingController);
exports.ratingRoutes = router;
