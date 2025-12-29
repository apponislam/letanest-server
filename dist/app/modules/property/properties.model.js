"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const properties_interface_1 = require("./properties.interface");
const PropertySchema = new mongoose_1.Schema({
    propertyNumber: { type: String, unique: true },
    // Step 1: Basic property info
    title: { type: String, required: [true, "Title is required"] },
    description: { type: String, required: [true, "Description is required"] },
    location: { type: String, required: [true, "Location is required"] },
    postCode: { type: String, required: [true, "Post code is required"] },
    propertyType: {
        type: String,
        enum: properties_interface_1.propertyTypeOptions,
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
    availableFrom: { type: Date },
    availableTo: { type: Date },
    calendarEnabled: { type: Boolean, default: true },
    amenities: {
        type: [String],
        enum: properties_interface_1.amenitiesList,
        default: [],
    },
    // Step 3: Media
    coverPhoto: { type: String, required: [true, "Cover photo is required"] },
    photos: { type: [String], default: [] },
    // Step 4: Terms agreement
    agreeTerms: { type: Boolean, required: [true, "Agreement to terms is required"] },
    termsAndConditions: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "TermsAndConditions",
    },
    // Metadata
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
}, {
    timestamps: true,
    versionKey: false,
});
PropertySchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        if (doc.isNew) {
            const lastProperty = yield mongoose_1.default.model("Property").findOne({}, { propertyNumber: 1 }).sort({ propertyNumber: -1 }).exec();
            let newNumber = 1;
            if (lastProperty === null || lastProperty === void 0 ? void 0 : lastProperty.propertyNumber) {
                newNumber = parseInt(lastProperty.propertyNumber, 10) + 1;
            }
            // Always pad to 9 digits, even when it goes beyond 999999999
            doc.propertyNumber = newNumber.toString().padStart(9, "0");
        }
        next();
    });
});
exports.PropertyModel = mongoose_1.default.model("Property", PropertySchema);
