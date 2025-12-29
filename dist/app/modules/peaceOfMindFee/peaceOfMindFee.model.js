"use strict";
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
exports.PeaceOfMindFee = void 0;
const mongoose_1 = require("mongoose");
const peaceOfMindFeeSchema = new mongoose_1.Schema({
    fee: {
        type: Number,
        required: true,
        min: 0,
    },
}, {
    timestamps: true,
});
// Ensure only one document exists
peaceOfMindFeeSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const count = yield (0, mongoose_1.model)("PeaceOfMindFee").countDocuments();
        if (count >= 1) {
            throw new Error("Only one peace of mind fee can exist");
        }
        next();
    });
});
exports.PeaceOfMindFee = (0, mongoose_1.model)("PeaceOfMindFee", peaceOfMindFeeSchema);
