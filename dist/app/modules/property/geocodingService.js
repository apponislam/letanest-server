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
exports.findNearbyPlaces = exports.geocodeAddress = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../config"));
const https_1 = __importDefault(require("https"));
const geocodeAddress = (location, postCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agent = new https_1.default.Agent({ family: 4 });
        const API_KEY = config_1.default.server_map_api_key;
        // const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location + " " + postCode)}&key=${API_KEY}`);
        const response = yield axios_1.default.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
                address: `${location} ${postCode}`.trim(),
                key: API_KEY,
            },
            httpsAgent: agent,
        });
        console.log(response);
        if (response.data.status === "OK" && response.data.results.length > 0) {
            const result = response.data.results[0];
            const { lat, lng } = result.geometry.location;
            return {
                lat: lat,
                lng: lng,
                formattedAddress: result.formatted_address,
            };
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
const findNearbyPlaces = (lat, lng) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agent = new https_1.default.Agent({ family: 4 });
        const API_KEY = config_1.default.server_map_api_key;
        // Search for each important type separately with small radius
        const placeTypes = ["train_station", "bus_station", "subway_station", "airport", "hospital", "pharmacy", "shopping_mall", "supermarket", "restaurant", "cafe", "park", "convenience_store"];
        const nearbyPlaces = [];
        for (const placeType of placeTypes) {
            try {
                const response = yield axios_1.default.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
                    params: {
                        location: `${lat},${lng}`,
                        radius: 160934,
                        type: placeType,
                        key: API_KEY,
                    },
                    httpsAgent: agent,
                });
                if (response.data.status === "OK" && response.data.results.length > 0) {
                    // Find the closest result for this type
                    let closestPlace = null;
                    let minDistance = Infinity;
                    response.data.results.forEach((place) => {
                        if (place.geometry && place.geometry.location) {
                            const distanceInMiles = calculateDistanceInMiles(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
                            if (distanceInMiles < minDistance && distanceInMiles <= 3) {
                                // Within 3 miles
                                minDistance = distanceInMiles;
                                closestPlace = {
                                    name: place.name,
                                    type: placeType.replace(/_/g, " "),
                                    distance: Math.round(distanceInMiles * 10) / 10,
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                    address: place.vicinity || place.name,
                                };
                            }
                        }
                    });
                    if (closestPlace) {
                        nearbyPlaces.push(closestPlace);
                    }
                }
                // Small delay to avoid rate limiting
                yield new Promise((resolve) => setTimeout(resolve, 200));
            }
            catch (typeError) {
                console.error(`Error searching for ${placeType}:`, typeError);
                continue;
            }
        }
        // Sort by distance and return
        return nearbyPlaces.sort((a, b) => a.distance - b.distance);
    }
    catch (error) {
        console.error("Nearby places search error:", error);
        return [];
    }
});
exports.findNearbyPlaces = findNearbyPlaces;
const calculateDistanceInMiles = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
