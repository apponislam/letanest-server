"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingValidations = void 0;
const zod_1 = require("zod");
// Common validation
const baseRatingValidation = {
    overallExperience: zod_1.z.number().min(1).max(5),
    description: zod_1.z.string().max(500).optional(),
};
// Property rating validation
const createPropertyRatingValidation = zod_1.z.object(Object.assign({ type: zod_1.z.literal("property"), propertyId: zod_1.z.string(), hostId: zod_1.z.string(), communication: zod_1.z.number().min(1).max(5), accuracy: zod_1.z.number().min(1).max(5), cleanliness: zod_1.z.number().min(1).max(5), checkInExperience: zod_1.z.number().min(1).max(5) }, baseRatingValidation));
// Site rating validation
const createSiteRatingValidation = zod_1.z.object(Object.assign({ type: zod_1.z.literal("site"), country: zod_1.z.string().min(1).max(100) }, baseRatingValidation));
// Generic create validation (less strict)
const createRatingValidation = zod_1.z
    .object({
    type: zod_1.z.enum(["property", "site"]),
    propertyId: zod_1.z.string().optional(),
    hostId: zod_1.z.string().optional(), // Added hostId
    communication: zod_1.z.number().min(1).max(5).optional(),
    accuracy: zod_1.z.number().min(1).max(5).optional(),
    cleanliness: zod_1.z.number().min(1).max(5).optional(),
    checkInExperience: zod_1.z.number().min(1).max(5).optional(),
    overallExperience: zod_1.z.number().min(1).max(5),
    country: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
})
    .refine((data) => {
    // Custom validation: if type is property, propertyId and hostId are required
    if (data.type === "property") {
        return !!(data.propertyId && data.hostId);
    }
    return true;
}, {
    message: "propertyId and hostId are required when type is 'property'",
    path: ["propertyId", "hostId"], // This will show error on both fields
});
const updateRatingValidation = zod_1.z.object({
    communication: zod_1.z.number().min(1).max(5).optional(),
    accuracy: zod_1.z.number().min(1).max(5).optional(),
    cleanliness: zod_1.z.number().min(1).max(5).optional(),
    checkInExperience: zod_1.z.number().min(1).max(5).optional(),
    overallExperience: zod_1.z.number().min(1).max(5).optional(),
    country: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
});
exports.ratingValidations = {
    createRatingValidation,
    createPropertyRatingValidation,
    createSiteRatingValidation,
    updateRatingValidation,
};
