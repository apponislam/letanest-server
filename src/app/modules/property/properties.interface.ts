import { Types } from "mongoose";

// Predefined lists
export const amenitiesList = [
    // Essentials
    "Wifi",
    "Towels Included",
    "Heating",
    "Air Conditioning",
    "Kitchen",
    "Washing Machine",
    "Dryer",
    "Tv",

    // Parking & Transport
    "Parking",
    "EV Charging Point",

    // Safety & Security
    "Smoke Alarm",
    "Carbon Monoxide Alarm",
    "First Aid Kit",
    "CCTV / Security Lighting",

    // Outdoor & Leisure
    "Garden",
    "Balcony / Terrace",
    "BBQ Facilities",
    "Outdoor Furniture",
    "Pool",
    "Hot Tub",
    "Beach Access",

    // Family-Friendly
    "High Chair",
    "Cot / Travel Cot",
    "Playground Nearby",

    // Extras
    "Gym",
    "Coffee Machine / Kettle",
    "Hairdryer",
    "Iron / Ironing Board",

    // Accessibility
    "Disability Access",
    "Disability Parking",
    "Lift Access",
    "Step-free Entrance",

    // Pet & Smoking Policies
    "Pet Friendly",
    "Smoking Allowed",
] as const;

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
    availableFrom?: Date;
    availableTo?: Date;
    calendarEnabled?: boolean;
    amenities: Amenity[];
}

// Step 3: Media
export interface IPropertyStep3 {
    coverPhoto: string;
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
    featured?: boolean;
    trending?: boolean;
    nearbyPlaces?: {
        name: string;
        type: string;
        distance: number;
        lat: number;
        lng: number;
        address: string;
    }[];
}

export interface IPropertyQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    propertyTypes?: string | string[];
    guests?: number;
    bedrooms?: number;
    availableFrom?: string;
    availableTo?: string;
    location?: string;
    amenities?: string | string[];
    rating?: string;
    type?: "featured" | "trending";
    seed?: string;
}

export interface IPropertyMeta {
    total: number;
    page: number;
    limit: number;
    totalAmount?: number;
    seed?: string;
}

export interface IPropertyListResponse {
    properties: IProperty[];
    meta: IPropertyMeta;
}

export interface UpdatePropertyRequest extends Partial<IProperty> {
    removeCoverPhoto?: string;
    existingPhotos?: string[];
}
