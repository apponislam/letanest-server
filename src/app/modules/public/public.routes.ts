import express from "express";
import auth from "../../middlewares/auth";
import { termsController } from "./public.controllers";

const router = express.Router();

router.get("/my-default-host", auth, termsController.getMyDefaultHostTermsController);

router.post("/", auth, termsController.createTermsController);
router.get("/", termsController.getAllTermsController);
router.get("/:id", termsController.getTermByIdController);
router.get("/host/default", termsController.getDefaultHostTermsController);
router.put("/:id", auth, termsController.updateTermController);
router.delete("/:id", auth, termsController.deleteTermController);
router.get("/target/:target", termsController.getTermsByTargetController);
// router.get("/property/:propertyId", termsController.getPropertyTermsController);

export const publicRoute = router;
