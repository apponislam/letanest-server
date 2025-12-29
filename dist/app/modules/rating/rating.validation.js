"use strict";
// import { z } from "zod";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingValidations = void 0;
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
const zod_1 = require("zod");
// Common validation
const baseRatingValidation = {
    overallExperience: zod_1.z.number().min(1).max(5),
    description: zod_1.z.string().max(500).optional(),
};
// Property rating validation
const createPropertyRatingValidation = zod_1.z.object(Object.assign({ type: zod_1.z.literal("property"), propertyId: zod_1.z.string(), reviewedId: zod_1.z.string(), communication: zod_1.z.number().min(1).max(5), accuracy: zod_1.z.number().min(1).max(5), cleanliness: zod_1.z.number().min(1).max(5), checkInExperience: zod_1.z.number().min(1).max(5) }, baseRatingValidation));
// Guest rating validation
const createGuestRatingValidation = zod_1.z.object({
    type: zod_1.z.literal("guest"),
    reviewedId: zod_1.z.string(), // Required for guest ratings
    overallExperience: zod_1.z.number().min(1).max(5),
    description: zod_1.z.string().max(500).optional(),
});
// Site rating validation
const createSiteRatingValidation = zod_1.z.object(Object.assign({ type: zod_1.z.literal("site"), country: zod_1.z.string().min(1).max(100), reviewedId: zod_1.z.string().optional() }, baseRatingValidation));
// Generic create validation
const createRatingValidation = zod_1.z
    .object({
    type: zod_1.z.enum(["property", "guest", "site"]),
    propertyId: zod_1.z.string().optional(),
    reviewedId: zod_1.z.string().optional(), // Make optional here too
    communication: zod_1.z.number().min(1).max(5).optional(),
    accuracy: zod_1.z.number().min(1).max(5).optional(),
    cleanliness: zod_1.z.number().min(1).max(5).optional(),
    checkInExperience: zod_1.z.number().min(1).max(5).optional(),
    overallExperience: zod_1.z.number().min(1).max(5),
    country: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
})
    .refine((data) => {
    if (data.type === "property") {
        return !!(data.propertyId && data.reviewedId && data.communication && data.accuracy && data.cleanliness && data.checkInExperience);
    }
    return true;
}, {
    message: "propertyId, reviewedId, and all rating criteria are required for property ratings",
    path: ["propertyId"],
})
    .refine((data) => {
    if (data.type === "guest") {
        return !!data.reviewedId;
    }
    return true;
}, {
    message: "reviewedId is required for guest ratings",
    path: ["reviewedId"],
})
    .refine((data) => {
    if (data.type === "site") {
        return !!data.country;
    }
    return true;
}, {
    message: "country is required for site ratings",
    path: ["country"],
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
// Admin status update validation
const updateRatingStatusValidation = zod_1.z.object({
    status: zod_1.z.enum(["pending", "approved", "rejected"]),
});
exports.ratingValidations = {
    createRatingValidation,
    createPropertyRatingValidation,
    createGuestRatingValidation,
    createSiteRatingValidation,
    updateRatingValidation,
    updateRatingStatusValidation,
};
