"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyPolicy = void 0;
const mongoose_1 = require("mongoose");
const privacyPolicySchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: true,
    },
    effectiveDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
exports.PrivacyPolicy = (0, mongoose_1.model)("PrivacyPolicy", privacyPolicySchema);
