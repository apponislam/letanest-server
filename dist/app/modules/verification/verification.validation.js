"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.verifySchema = void 0;
const zod_1 = require("zod");
exports.verifySchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required").trim(),
    lastName: zod_1.z.string().min(1, "Last name is required").trim(),
    dob: zod_1.z.string().min(1, "Date of birth is required"),
    countryOfBirth: zod_1.z.string().min(1, "Country of birth is required").trim(),
    cityOfBirth: zod_1.z.string().min(1, "City of birth is required").trim(),
    zip: zod_1.z.string().min(1, "Zip code is required").trim(),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["approved", "rejected", "under_review"]),
    reviewNotes: zod_1.z.string().optional(),
});
