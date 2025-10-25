"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePropertySchema = exports.createPropertySchema = exports.step4Schema = exports.step3Schema = exports.step2Schema = exports.step1Schema = void 0;
const zod_1 = require("zod");
const properties_interface_1 = require("./properties.interface");
// Step 1
exports.step1Schema = zod_1.z.object({
    title: zod_1.z.string().min(2, "Property title must be at least 2 characters"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters"),
    location: zod_1.z.string().min(2, "Location is required"),
    postCode: zod_1.z.string().min(2, "Post code is required"),
    propertyType: zod_1.z.enum(properties_interface_1.propertyTypeOptions),
});
// Step 2
exports.step2Schema = zod_1.z.object({
    maxGuests: zod_1.z.number().min(1, "At least 1 guest is required"),
    bedrooms: zod_1.z.number().min(1, "At least 1 bedroom is required"),
    bathrooms: zod_1.z.number().min(1, "At least 1 bathroom is required"),
    price: zod_1.z.number().min(0, "Price must be 0 or greater"),
    availableFrom: zod_1.z.preprocess((val) => (val ? new Date(val) : undefined), zod_1.z.date()),
    availableTo: zod_1.z.preprocess((val) => (val ? new Date(val) : undefined), zod_1.z.date()),
    amenities: zod_1.z.array(zod_1.z.enum(properties_interface_1.amenitiesList)).min(1, "Select at least 1 amenity"),
});
// Step 3
exports.step3Schema = zod_1.z.object({
    coverPhoto: zod_1.z.string().min(1, "Cover photo is required"),
    photos: zod_1.z.array(zod_1.z.string()).min(1, "Please upload at least 1 photo"),
});
// Step 4
exports.step4Schema = zod_1.z.object({
    agreeTerms: zod_1.z.boolean().refine((val) => val === true, "You must agree to the terms"),
});
// Full create schema
exports.createPropertySchema = zod_1.z.object(Object.assign(Object.assign(Object.assign(Object.assign({}, exports.step1Schema.shape), exports.step2Schema.shape), exports.step3Schema.shape), exports.step4Schema.shape));
// Full update schema (partial allowed)
exports.updatePropertySchema = exports.createPropertySchema.partial();
