import express from "express";
import auth from "../../middlewares/auth";
import { termsController } from "./public.controllers";

const router = express.Router();

router.post("/", auth, termsController.createTermsController);

router.get("/", termsController.getAllTermsController);

router.get("/:id", termsController.getTermByIdController);

router.put("/:id", auth, termsController.updateTermController);

router.delete("/:id", auth, termsController.deleteTermController);

router.get("/creator/:creatorType", termsController.getTermsByCreatorTypeController);

router.get("/property/:propertyId", termsController.getPropertyTermsController);

export const publicRoute = router;
