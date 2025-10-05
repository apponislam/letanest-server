import { z } from "zod";
import { amenitiesList, propertyTypeOptions, PropertyType, Amenity } from "./properties.interface";

// Step 1
export const step1Schema = z.object({
    title: z.string().min(2, "Property title must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    location: z.string().min(2, "Location is required"),
    postCode: z.string().min(2, "Post code is required"),
    propertyType: z.enum(propertyTypeOptions as unknown as [PropertyType, ...PropertyType[]]),
});

// Step 2
export const step2Schema = z.object({
    maxGuests: z.number().min(1, "At least 1 guest is required"),
    bedrooms: z.number().min(1, "At least 1 bedroom is required"),
    bathrooms: z.number().min(1, "At least 1 bathroom is required"),
    price: z.number().min(0, "Price must be 0 or greater"),
    availableFrom: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date()),
    availableTo: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date()),
    amenities: z.array(z.enum(amenitiesList as unknown as [Amenity, ...Amenity[]])).min(1, "Select at least 1 amenity"),
});

// Step 3
export const step3Schema = z.object({
    coverPhoto: z.string().min(1, "Cover photo is required"),
    photos: z.array(z.string()).min(1, "Please upload at least 1 photo"),
});

// Step 4
export const step4Schema = z.object({
    agreeTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
});

// Full create schema
export const createPropertySchema = z.object({
    ...step1Schema.shape,
    ...step2Schema.shape,
    ...step3Schema.shape,
    ...step4Schema.shape,
});

// Full update schema (partial allowed)
export const updatePropertySchema = createPropertySchema.partial();

// Types
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
