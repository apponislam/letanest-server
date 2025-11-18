import express from "express";
import auth from "../../middlewares/auth";
import { peaceOfMindFeeControllers } from "./peaceOfMindFee.controllers";

const router = express.Router();

router.post("/", auth, peaceOfMindFeeControllers.createOrUpdateFee);
router.get("/", peaceOfMindFeeControllers.getFee);

export const peaceOfMindFeeRoutes = router;
