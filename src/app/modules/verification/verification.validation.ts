import { z } from "zod";

export const verifySchema = z.object({
    firstName: z.string().min(1, "First name is required").trim(),
    lastName: z.string().min(1, "Last name is required").trim(),
    dob: z.string().min(1, "Date of birth is required"),
    countryOfBirth: z.string().min(1, "Country of birth is required").trim(),
    cityOfBirth: z.string().min(1, "City of birth is required").trim(),
    zip: z.string().min(1, "Zip code is required").trim(),
});

export const updateStatusSchema = z.object({
    status: z.enum(["approved", "rejected", "under_review"]),
    reviewNotes: z.string().optional(),
});

export type VerifyInput = z.infer<typeof verifySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
