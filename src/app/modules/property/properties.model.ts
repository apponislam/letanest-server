import mongoose, { Schema } from "mongoose";
import { IProperty, amenitiesList, propertyTypeOptions } from "./properties.interface";

const PropertySchema = new Schema<IProperty>(
    {
        // Step 1: Basic property info
        title: { type: String, required: [true, "Title is required"] },
        description: { type: String, required: [true, "Description is required"] },
        location: { type: String, required: [true, "Location is required"] },
        postCode: { type: String, required: [true, "Post code is required"] },
        propertyType: {
            type: String,
            enum: propertyTypeOptions,
            required: [true, "Property type is required"],
        },

        // Step 2: Property details
        maxGuests: { type: Number, required: [true, "Max guests is required"] },
        bedrooms: { type: Number, required: [true, "Bedrooms count is required"] },
        bathrooms: { type: Number, required: [true, "Bathrooms count is required"] },
        price: { type: Number, required: [true, "Price is required"], min: 0 },
        availableFrom: { type: Date, required: [true, "Available from date is required"] },
        availableTo: { type: Date, required: [true, "Available to date is required"] },
        amenities: {
            type: [String],
            enum: amenitiesList,
            default: [],
        },

        // Step 3: Media
        coverPhoto: { type: String, required: [true, "Cover photo is required"] },
        photos: { type: [String], default: [] },

        // Step 4: Terms agreement
        agreeTerms: { type: Boolean, required: [true, "Agreement to terms is required"] },

        // Metadata
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ["draft", "pending", "published", "archived", "rejected", "under_review"],
            default: "pending",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const PropertyModel = mongoose.model<IProperty>("Property", PropertySchema);
