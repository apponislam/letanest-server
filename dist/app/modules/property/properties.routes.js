"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyRoutes = void 0;
const express_1 = __importDefault(require("express"));
const properties_controllers_1 = require("./properties.controllers");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const propertyPhotos_1 = require("../../middlewares/propertyPhotos");
const router = express_1.default.Router();
router.post("/", auth_1.default, (0, authorize_1.default)(["ADMIN", "HOST"]), propertyPhotos_1.uploadPropertyFiles, properties_controllers_1.propertyControllers.createPropertyController);
router.put("/:id", auth_1.default, (0, authorize_1.default)(["ADMIN", "HOST"]), propertyPhotos_1.uploadPropertyFiles, properties_controllers_1.propertyControllers.updatePropertyController);
// Anyone authenticated can view single property
router.get("/:id", properties_controllers_1.propertyControllers.getSinglePropertyController);
// Listing with pagination, search, filter
router.get("/", properties_controllers_1.propertyControllers.getAllPropertiesController);
router.get("/admin/published", auth_1.default, (0, authorize_1.default)(["ADMIN"]), properties_controllers_1.propertyControllers.getAllPublishedPropertiesController);
router.get("/admin/all", auth_1.default, (0, authorize_1.default)(["ADMIN"]), properties_controllers_1.propertyControllers.getAllNonPublishedPropertiesController);
router.patch("/:id/status", auth_1.default, (0, authorize_1.default)(["ADMIN"]), properties_controllers_1.propertyControllers.changePropertyStatusController);
// Host
router.get("/host/my-properties", auth_1.default, properties_controllers_1.propertyControllers.getHostProperties);
router.delete("/host/my-properties/:id", auth_1.default, properties_controllers_1.propertyControllers.deleteHostProperty);
router.get("/host/my-published-properties", auth_1.default, properties_controllers_1.propertyControllers.getMyPublishedPropertiesController);
router.get("/host/search-published-properties", auth_1.default, properties_controllers_1.propertyControllers.searchMyPublishedPropertiesController);
router.get("/property/max-price", properties_controllers_1.propertyControllers.getMaxRoundedPriceController);
exports.propertyRoutes = router;
