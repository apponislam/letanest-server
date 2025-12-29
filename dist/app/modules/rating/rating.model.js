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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const rating_interface_1 = require("./rating.interface");
const ratingSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(rating_interface_1.RatingType),
        required: true,
    },
    propertyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Property",
        required: function () {
            return this.type === rating_interface_1.RatingType.PROPERTY;
        },
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reviewedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
            return this.type === rating_interface_1.RatingType.PROPERTY || this.type === rating_interface_1.RatingType.GUEST;
        },
    },
    communication: {
        type: Number,
        min: 1,
        max: 5,
        required: function () {
            return this.type === rating_interface_1.RatingType.PROPERTY || this.type === rating_interface_1.RatingType.GUEST;
        },
    },
    accuracy: {
        type: Number,
        min: 1,
        max: 5,
        required: function () {
            return this.type === rating_interface_1.RatingType.PROPERTY || this.type === rating_interface_1.RatingType.GUEST;
        },
    },
    cleanliness: {
        type: Number,
        min: 1,
        max: 5,
        required: function () {
            return this.type === rating_interface_1.RatingType.PROPERTY || this.type === rating_interface_1.RatingType.GUEST;
        },
    },
    checkInExperience: {
        type: Number,
        min: 1,
        max: 5,
        required: function () {
            return this.type === rating_interface_1.RatingType.PROPERTY || this.type === rating_interface_1.RatingType.GUEST;
        },
    },
    overallExperience: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    country: {
        type: String,
        required: function () {
            return this.type === rating_interface_1.RatingType.SITE;
        },
    },
    isDeleted: { type: Boolean, default: false },
    description: {
        type: String,
        maxlength: 500,
    },
    status: {
        type: String,
        enum: Object.values(rating_interface_1.RatingStatus),
        default: function () {
            return this.type === rating_interface_1.RatingType.SITE ? rating_interface_1.RatingStatus.PENDING : rating_interface_1.RatingStatus.APPROVED;
        },
    },
}, {
    timestamps: true,
});
ratingSchema.index({ reviewedId: 1, type: 1 });
ratingSchema.index({ userId: 1, type: 1 });
ratingSchema.index({ status: 1 });
ratingSchema.index({ propertyId: 1 });
ratingSchema.index({ createdAt: 1 });
exports.RatingModel = mongoose_1.default.model("Rating", ratingSchema);
