import express from "express";
import { userControllers } from "./users.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorize";
import { roles } from "../auth/auth.interface";
import { uploadProfileImage } from "./updatePhoto";

const router = express.Router();

router.get("/", auth, authorize([roles.ADMIN]), userControllers.getAllUsersController);

// ✅ Admin-only: Get single user
router.get("/:id", auth, userControllers.getSingleUserController);

router.patch("/profile", auth, uploadProfileImage, userControllers.updateUserProfileController);

export const userRoutes = router;
