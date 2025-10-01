import express from "express";
import auth from "../../middlewares/auth";
import { termsController } from "./public.controllers";

const router = express.Router();

router.post("/", auth, termsController.createTermsController);

router.get("/", termsController.getAllTermsController);

// Get T&C by ID (public)
router.get("/:id", termsController.getTermByIdController);

// Update T&C (logged in)
router.put("/:id", auth, termsController.updateTermController);

// Delete T&C (logged in)
router.delete("/:id", auth, termsController.deleteTermController);

// Get T&C by creator type (admin or host)
router.get("/creator/:creatorType", termsController.getTermsByCreatorTypeController);

// Get property-specific T&C
router.get("/property/:propertyId", termsController.getPropertyTermsController);

export const publicRoute = router;
