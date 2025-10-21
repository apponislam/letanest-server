import { z } from "zod";

// Common validation
const baseRatingValidation = {
    overallExperience: z.number().min(1).max(5),
    description: z.string().max(500).optional(),
};

// Property rating validation
const createPropertyRatingValidation = z.object({
    type: z.literal("property"),
    propertyId: z.string(),
    hostId: z.string(), // Added hostId
    communication: z.number().min(1).max(5),
    accuracy: z.number().min(1).max(5),
    cleanliness: z.number().min(1).max(5),
    checkInExperience: z.number().min(1).max(5),
    ...baseRatingValidation,
});

// Site rating validation
const createSiteRatingValidation = z.object({
    type: z.literal("site"),
    country: z.string().min(1).max(100),
    ...baseRatingValidation,
});

// Generic create validation (less strict)
const createRatingValidation = z
    .object({
        type: z.enum(["property", "site"]),
        propertyId: z.string().optional(),
        hostId: z.string().optional(), // Added hostId
        communication: z.number().min(1).max(5).optional(),
        accuracy: z.number().min(1).max(5).optional(),
        cleanliness: z.number().min(1).max(5).optional(),
        checkInExperience: z.number().min(1).max(5).optional(),
        overallExperience: z.number().min(1).max(5),
        country: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
    })
    .refine(
        (data) => {
            // Custom validation: if type is property, propertyId and hostId are required
            if (data.type === "property") {
                return !!(data.propertyId && data.hostId);
            }
            return true;
        },
        {
            message: "propertyId and hostId are required when type is 'property'",
            path: ["propertyId", "hostId"], // This will show error on both fields
        }
    );

const updateRatingValidation = z.object({
    communication: z.number().min(1).max(5).optional(),
    accuracy: z.number().min(1).max(5).optional(),
    cleanliness: z.number().min(1).max(5).optional(),
    checkInExperience: z.number().min(1).max(5).optional(),
    overallExperience: z.number().min(1).max(5).optional(),
    country: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
});

export const ratingValidations = {
    createRatingValidation,
    createPropertyRatingValidation,
    createSiteRatingValidation,
    updateRatingValidation,
};
