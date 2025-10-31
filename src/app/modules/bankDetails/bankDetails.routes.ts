import express from "express";
import auth from "../../middlewares/auth";
import { bankDetailsControllers } from "./bankDetails.controllers";

const router = express.Router();

router.post("/", auth, bankDetailsControllers.createBankDetails);
router.get("/", auth, bankDetailsControllers.getMyBankDetails);
router.get("/user/:userId", bankDetailsControllers.getBankDetailsByUserId);
router.patch("/", auth, bankDetailsControllers.updateMyBankDetails);
router.delete("/", auth, bankDetailsControllers.deleteMyBankDetails);

export const bankDetailsRoutes = router;
