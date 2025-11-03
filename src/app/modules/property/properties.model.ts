import mongoose, { Schema } from "mongoose";
import { IProperty, amenitiesList, propertyTypeOptions } from "./properties.interface";

const PropertySchema = new Schema<IProperty>(
    {
        propertyNumber: { type: String, unique: true },
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

        coordinates: {
            lat: { type: Number },
            lng: { type: Number },
        },

        // Nearby places array (optional)
        nearbyPlaces: {
            type: [
                {
                    name: { type: String },
                    type: { type: String },
                    distance: { type: Number },
                    lat: { type: Number },
                    lng: { type: Number },
                    address: { type: String },
                },
            ],
            default: [],
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
        termsAndConditions: {
            type: Schema.Types.ObjectId,
            ref: "TermsAndConditions",
        },

        // Metadata
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ["pending", "published", "rejected", "hidden"],
            default: "pending",
        },
        isDeleted: { type: Boolean, default: false },
        featured: {
            type: Boolean,
            default: null,
        },
        trending: {
            type: Boolean,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

PropertySchema.pre("save", async function (next) {
    const doc = this as any;

    if (doc.isNew) {
        const lastProperty = await mongoose.model("Property").findOne({}, { propertyNumber: 1 }).sort({ propertyNumber: -1 }).exec();

        let newNumber = 1;
        if (lastProperty?.propertyNumber) {
            newNumber = parseInt(lastProperty.propertyNumber, 10) + 1;
        }

        // Always pad to 9 digits, even when it goes beyond 999999999
        doc.propertyNumber = newNumber.toString().padStart(9, "0");
    }

    next();
});

export const PropertyModel = mongoose.model<IProperty>("Property", PropertySchema);
