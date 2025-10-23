import { Types } from "mongoose";

// Predefined lists
export const amenitiesList = ["Wifi", "Garden", "Beach Access", "Parking", "Pool", "Smoking Allowed", "Hot Tub", "Pet Friendly", "Balcony", "Towels Included", "Dryer", "Kitchen", "Tv", "Gym", "Lift Access", "Disability Access", "Disability Access"] as const;

export const propertyTypeOptions = ["Hotel", "Apartment", "Aparthotel", "Bed & Breakfast", "Hostel", "Guesthouse", "Entire Home", "Room Only", "Student Accommodation", "Unique Stays", "Caravan"] as const;

// Types
export type Amenity = (typeof amenitiesList)[number];
export type PropertyType = (typeof propertyTypeOptions)[number];

// Step 1: Basic property info
export interface IPropertyStep1 {
    title: string;
    description: string;
    location: string;
    postCode: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    propertyType: PropertyType;
}

// Step 2: Property details
export interface IPropertyStep2 {
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    price: number;
    availableFrom: Date;
    availableTo: Date;
    amenities: Amenity[];
}

// Step 3: Media
export interface IPropertyStep3 {
    coverPhoto: string; // first photo
    photos: string[];
}

// Step 4: Terms agreement
export interface IPropertyStep4 {
    agreeTerms: boolean;
    termsAndConditions?: Types.ObjectId;
}

// Complete Property Interface
export interface IProperty extends IPropertyStep1, IPropertyStep2, IPropertyStep3, IPropertyStep4 {
    propertyNumber?: string;
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    status?: "pending" | "published" | "rejected" | "hidden";
    isDeleted?: boolean;
}

export interface IPropertyQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    guests?: number;
    bedrooms?: number;
    availableFrom?: string;
    availableTo?: string;
    location?: string;
    amenities?: string | string[];
}

export interface IPropertyMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totalAmount?: number;
}

export interface IPropertyListResponse {
    properties: IProperty[];
    meta: IPropertyMeta;
}
