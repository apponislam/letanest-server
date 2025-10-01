"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRoute = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const public_controllers_1 = require("./public.controllers");
const router = express_1.default.Router();
router.post("/", auth_1.default, public_controllers_1.termsController.createTermsController);
router.get("/", public_controllers_1.termsController.getAllTermsController);
// Get T&C by ID (public)
router.get("/:id", public_controllers_1.termsController.getTermByIdController);
// Update T&C (logged in)
router.put("/:id", auth_1.default, public_controllers_1.termsController.updateTermController);
// Delete T&C (logged in)
router.delete("/:id", auth_1.default, public_controllers_1.termsController.deleteTermController);
// Get T&C by creator type (admin or host)
router.get("/creator/:creatorType", public_controllers_1.termsController.getTermsByCreatorTypeController);
// Get property-specific T&C
router.get("/property/:propertyId", public_controllers_1.termsController.getPropertyTermsController);
exports.publicRoute = router;
