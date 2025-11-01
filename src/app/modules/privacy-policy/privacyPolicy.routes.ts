import { Router } from "express";
import { PrivacyPolicyController } from "./privacyPolicy.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/", auth, PrivacyPolicyController.createOrUpdatePrivacyPolicy);
router.get("/", PrivacyPolicyController.getPrivacyPolicy);
router.patch("/", auth, PrivacyPolicyController.updatePrivacyPolicy);

export const privacyPolicyRoutes = router;
