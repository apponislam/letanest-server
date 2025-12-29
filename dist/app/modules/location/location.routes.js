"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const location_controllers_1 = require("./location.controllers");
const router = express_1.default.Router();
router.post("/", auth_1.default, location_controllers_1.locationControllers.createLocation);
router.get("/", location_controllers_1.locationControllers.getAllLocations);
router.get("/search", location_controllers_1.locationControllers.searchLocations);
router.get("/:locationId", location_controllers_1.locationControllers.getLocationById);
router.patch("/:locationId", auth_1.default, location_controllers_1.locationControllers.updateLocation);
router.delete("/:locationId", auth_1.default, location_controllers_1.locationControllers.deleteLocation);
exports.locationRoutes = router;
