// import axios from "axios";
// import config from "../../config";

// export interface GeocodingResult {
//     lat: number;
//     lng: number;
//     formattedAddress: string;
// }

// export const geocodeAddress = async (location: string, postCode: string): Promise<GeocodingResult | null> => {
//     try {
//         const API_KEY = config.map_api_key;

//         const response = await axios.get(`http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${encodeURIComponent(location + " " + postCode)}&limit=1`);

//         console.log("PositionStack response:", response.data);

//         if (response.data.data && response.data.data.length > 0) {
//             const result = response.data.data[0];

//             if (result.latitude && result.longitude) {
//                 return {
//                     lat: result.latitude,
//                     lng: result.longitude,
//                     formattedAddress: result.label || `${location}, ${postCode}`,
//                 };
//             }
//         }

//         console.log("No coordinates found for:", location, postCode);
//         return null;
//     } catch (error) {
//         console.error("Geocoding error:", error);
//         return null;
//     }
// };

import axios from "axios";
import config from "../../config";

export interface GeocodingResult {
    lat: number;
    lng: number;
    formattedAddress: string;
}

export const geocodeAddress = async (location: string, postCode: string): Promise<GeocodingResult | null> => {
    try {
        const API_KEY = config.server_map_api_key;
        console.log(API_KEY);

        // Global search - no country restriction
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location + " " + postCode)}&key=${API_KEY}`);

        console.log("Google Geocoding response:", response.data);

        if (response.data.status === "OK" && response.data.results.length > 0) {
            const result = response.data.results[0];
            const { lat, lng } = result.geometry.location;

            return {
                lat: lat,
                lng: lng,
                formattedAddress: result.formatted_address,
            };
        } else if (response.data.status === "ZERO_RESULTS") {
            console.log("No coordinates found for:", location, postCode);
            return null;
        } else {
            console.error("Geocoding API error:", response.data.status, response.data.error_message);
            return null;
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};

// import axios from "axios";
// import config from "../../config";

// export interface GeocodingResult {
//     lat: number;
//     lng: number;
//     formattedAddress: string;
// }

// export interface NearbyPlace {
//     name: string;
//     type: string;
//     distance: number; // in miles
//     lat: number;
//     lng: number;
//     address: string;
// }

// export const geocodeAddress = async (location: string, postCode: string): Promise<GeocodingResult | null> => {
//     try {
//         const API_KEY = config.map_api_key;

//         const response = await axios.get(`http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${encodeURIComponent(location + " " + postCode)}&limit=1`);

//         console.log("PositionStack response:", response.data);

//         if (response.data.data && response.data.data.length > 0) {
//             const result = response.data.data[0];

//             if (result.latitude && result.longitude) {
//                 return {
//                     lat: result.latitude,
//                     lng: result.longitude,
//                     formattedAddress: result.label || `${location}, ${postCode}`,
//                 };
//             }
//         }

//         console.log("No coordinates found for:", location, postCode);
//         return null;
//     } catch (error) {
//         console.error("Geocoding error:", error);
//         return null;
//     }
// };

// // NEW: Function to find nearby places with mile calculation
// export const findNearbyPlaces = async (lat: number, lng: number): Promise<NearbyPlace[]> => {
//     try {
//         const API_KEY = config.map_api_key;

//         // Search for different types of important places
//         const placeTypes = ["airport", "train_station", "bus_station", "shopping_mall", "supermarket", "hospital", "university", "school", "park"];

//         const nearbyPlaces: NearbyPlace[] = [];

//         // Search for each type of place
//         for (const type of placeTypes) {
//             try {
//                 const response = await axios.get(`http://api.positionstack.com/v1/reverse?access_key=${API_KEY}&query=${type}&limit=3&latitude=${lat}&longitude=${lng}`);

//                 if (response.data.data && response.data.data.length > 0) {
//                     response.data.data.forEach((place: any) => {
//                         if (place.latitude && place.longitude && place.name) {
//                             // Calculate distance in miles
//                             const distanceInMiles = calculateDistanceInMiles(lat, lng, place.latitude, place.longitude);

//                             // Only include places within 20 miles
//                             if (distanceInMiles <= 20) {
//                                 nearbyPlaces.push({
//                                     name: place.name,
//                                     type: type,
//                                     distance: Math.round(distanceInMiles * 10) / 10, // Round to 1 decimal
//                                     lat: place.latitude,
//                                     lng: place.longitude,
//                                     address: place.label || place.name,
//                                 });
//                             }
//                         }
//                     });
//                 }
//             } catch (error) {
//                 console.error(`Error fetching ${type}:`, error);
//                 continue;
//             }
//         }

//         // Sort by distance (closest first) and return
//         return nearbyPlaces.sort((a, b) => a.distance - b.distance);
//     } catch (error) {
//         console.error("Nearby places search error:", error);
//         return [];
//     }
// };

// // Helper function to calculate distance in miles
// const calculateDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//     const R = 3959; // Earth's radius in miles
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c; // Distance in miles
// };
