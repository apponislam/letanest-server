import express from "express";
import auth from "../../middlewares/auth";
import { locationControllers } from "./location.controllers";

const router = express.Router();

router.post("/", auth, locationControllers.createLocation);
router.get("/", locationControllers.getAllLocations);
router.get("/search", locationControllers.searchLocations);
router.get("/:locationId", locationControllers.getLocationById);
router.patch("/:locationId", auth, locationControllers.updateLocation);
router.delete("/:locationId", auth, locationControllers.deleteLocation);

export const locationRoutes = router;
