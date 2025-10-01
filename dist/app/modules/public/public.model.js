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
exports.TermsAndConditionsModel = exports.roles = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.roles = {
    GUEST: "GUEST",
    HOST: "HOST",
    ADMIN: "ADMIN",
};
const TermsAndConditionsSchema = new mongoose_1.default.Schema({
    id: {
        type: String,
        required: [true, "T&C ID is required"],
        unique: true,
    },
    title: {
        type: String,
        required: [true, "Title is required"],
    },
    content: {
        type: String,
        required: [true, "Content is required"],
    },
    version: {
        type: String,
    },
    effectiveDate: {
        type: Date,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "CreatedBy (user ID) is required"],
    },
    creatorType: {
        type: String,
        enum: {
            values: [exports.roles.ADMIN, exports.roles.HOST],
            message: "CreatorType must be either 'ADMIN' or 'HOST'",
        },
        required: [true, "CreatorType is required"],
    },
    hostTarget: {
        type: String,
        enum: {
            values: ["default", "property"],
            message: "HostTarget must be 'default' or 'property'",
        },
    },
    propertyId: {
        type: String,
        // We'll validate later if hostTarget === 'property'
    },
}, { timestamps: true });
// Optional: validate propertyId is required only when hostTarget === "property"
TermsAndConditionsSchema.pre("save", function (next) {
    if (this.creatorType === exports.roles.HOST && this.hostTarget === "property" && !this.propertyId) {
        return next(new Error("PropertyId is required for property-specific T&C"));
    }
    next();
});
exports.TermsAndConditionsModel = mongoose_1.default.model("TermsAndConditions", TermsAndConditionsSchema);
