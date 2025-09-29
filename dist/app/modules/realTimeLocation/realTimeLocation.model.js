"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeLocationModel = void 0;
const mongoose_1 = require("mongoose");
const realtimeLocationSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    serialId: { type: String, required: true, unique: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    altitude: { type: Number },
    heading: { type: Number },
    speed: { type: Number },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    hideLocation: { type: Boolean, default: false },
}, {
    timestamps: true, // only track last update
    versionKey: false,
});
exports.RealtimeLocationModel = (0, mongoose_1.model)("RealtimeLocation", realtimeLocationSchema);
