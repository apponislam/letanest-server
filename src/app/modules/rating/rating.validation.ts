// import { z } from "zod";

// // Common validation
// const baseRatingValidation = {
//     overallExperience: z.number().min(1).max(5),
//     description: z.string().max(500).optional(),
// };

// // Property rating validation
// const createPropertyRatingValidation = z.object({
//     type: z.literal("property"),
//     propertyId: z.string(),
//     hostId: z.string(),
//     communication: z.number().min(1).max(5),
//     accuracy: z.number().min(1).max(5),
//     cleanliness: z.number().min(1).max(5),
//     checkInExperience: z.number().min(1).max(5),
//     ...baseRatingValidation,
// });

// // Site rating validation
// const createSiteRatingValidation = z.object({
//     type: z.literal("site"),
//     country: z.string().min(1).max(100),
//     ...baseRatingValidation,
// });

// // Generic create validation
// const createRatingValidation = z
//     .object({
//         type: z.enum(["property", "site"]),
//         propertyId: z.string().optional(),
//         hostId: z.string().optional(),
//         communication: z.number().min(1).max(5).optional(),
//         accuracy: z.number().min(1).max(5).optional(),
//         cleanliness: z.number().min(1).max(5).optional(),
//         checkInExperience: z.number().min(1).max(5).optional(),
//         overallExperience: z.number().min(1).max(5),
//         country: z.string().min(1).max(100).optional(),
//         description: z.string().max(500).optional(),
//     })
//     .refine(
//         (data) => {
//             if (data.type === "property") {
//                 return !!(data.propertyId && data.hostId);
//             }
//             return true;
//         },
//         {
//             message: "propertyId and hostId are required when type is 'property'",
//             path: ["propertyId", "hostId"],
//         }
//     );

// const updateRatingValidation = z.object({
//     communication: z.number().min(1).max(5).optional(),
//     accuracy: z.number().min(1).max(5).optional(),
//     cleanliness: z.number().min(1).max(5).optional(),
//     checkInExperience: z.number().min(1).max(5).optional(),
//     overallExperience: z.number().min(1).max(5).optional(),
//     country: z.string().min(1).max(100).optional(),
//     description: z.string().max(500).optional(),
// });

// // Admin status update validation
// const updateRatingStatusValidation = z.object({
//     status: z.enum(["pending", "approved", "rejected"]),
// });

// export const ratingValidations = {
//     createRatingValidation,
//     createPropertyRatingValidation,
//     createSiteRatingValidation,
//     updateRatingValidation,
//     updateRatingStatusValidation,
// };

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
    reviewedId: z.string(), // Required for property ratings
    communication: z.number().min(1).max(5),
    accuracy: z.number().min(1).max(5),
    cleanliness: z.number().min(1).max(5),
    checkInExperience: z.number().min(1).max(5),
    ...baseRatingValidation,
});

// Guest rating validation
const createGuestRatingValidation = z.object({
    type: z.literal("guest"),
    reviewedId: z.string(), // Required for guest ratings
    overallExperience: z.number().min(1).max(5),
    description: z.string().max(500).optional(),
});

// Site rating validation
const createSiteRatingValidation = z.object({
    type: z.literal("site"),
    country: z.string().min(1).max(100),
    reviewedId: z.string().optional(), // Optional for site ratings
    ...baseRatingValidation,
});

// Generic create validation
const createRatingValidation = z
    .object({
        type: z.enum(["property", "guest", "site"]),
        propertyId: z.string().optional(),
        reviewedId: z.string().optional(), // Make optional here too
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
            if (data.type === "property") {
                return !!(data.propertyId && data.reviewedId && data.communication && data.accuracy && data.cleanliness && data.checkInExperience);
            }
            return true;
        },
        {
            message: "propertyId, reviewedId, and all rating criteria are required for property ratings",
            path: ["propertyId"],
        }
    )
    .refine(
        (data) => {
            if (data.type === "guest") {
                return !!data.reviewedId;
            }
            return true;
        },
        {
            message: "reviewedId is required for guest ratings",
            path: ["reviewedId"],
        }
    )
    .refine(
        (data) => {
            if (data.type === "site") {
                return !!data.country;
            }
            return true;
        },
        {
            message: "country is required for site ratings",
            path: ["country"],
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

// Admin status update validation
const updateRatingStatusValidation = z.object({
    status: z.enum(["pending", "approved", "rejected"]),
});

export const ratingValidations = {
    createRatingValidation,
    createPropertyRatingValidation,
    createGuestRatingValidation,
    createSiteRatingValidation,
    updateRatingValidation,
    updateRatingStatusValidation,
};
