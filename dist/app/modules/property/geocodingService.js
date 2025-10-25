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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeAddress = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../config"));
const geocodeAddress = (location, postCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const API_KEY = config_1.default.map_api_key;
        // Remove country restriction or set to Bangladesh for BD addresses
        const response = yield axios_1.default.get(`http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${encodeURIComponent(location + " " + postCode)}&limit=1`);
        console.log("PositionStack response:", response.data);
        if (response.data.data && response.data.data.length > 0) {
            const result = response.data.data[0];
            if (result.latitude && result.longitude) {
                return {
                    lat: result.latitude,
                    lng: result.longitude,
                    formattedAddress: result.label || `${location}, ${postCode}`,
                };
            }
        }
        console.log("No coordinates found for:", location, postCode);
        return null;
    }
    catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
});
exports.geocodeAddress = geocodeAddress;
