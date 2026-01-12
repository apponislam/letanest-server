import express from "express";
import { userControllers } from "./users.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorize";
import { roles } from "../auth/auth.interface";
import { uploadProfileImage } from "./updatePhoto";
import { userDownloader } from "./userDataDownload";

const router = express.Router();

router.get("/", auth, authorize([roles.ADMIN]), userControllers.getAllUsersController);

router.get("/download-excel", auth, userDownloader.downloadUsersExcel);

// Get single user
router.get("/:id", auth, userControllers.getSingleUserController);

router.patch("/profile", auth, uploadProfileImage, userControllers.updateUserProfileController);

router.get("/me/subscriptions", auth, userControllers.getMySubscriptionsController);

// ONLY THIS NEW ROUTE
router.post("/me/free-tier/activate", auth, userControllers.activateFreeTierController);

// Stripe Connect Routes (Host only)
router.post("/stripe/connect", auth, userControllers.connectStripeAccountController);
router.get("/stripe/status", auth, userControllers.getStripeAccountStatusController);
router.get("/stripe/dashboard", auth, userControllers.getStripeDashboardController);
router.post("/stripe/disconnect", auth, userControllers.disconnectStripeAccountController);

// get me
router.get("/me/profile", auth, userControllers.getMyProfileController);

router.get("/random/admin", auth, userControllers.getRandomAdminController);

router.patch("/change-role", auth, authorize([roles.ADMIN]), userControllers.changeUserRoleController);
router.patch("/delete", auth, authorize([roles.ADMIN]), userControllers.deleteUserController);

router.get("/me/receive-emails", auth, userControllers.getReceiveEmailsController);
router.patch("/me/receive-emails", auth, userControllers.toggleReceiveEmailsController);

export const userRoutes = router;
