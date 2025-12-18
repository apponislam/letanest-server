import axios from "axios";
import config from "../../config";

export interface GeocodingResult {
    lat: number;
    lng: number;
    formattedAddress: string;
}

export interface NearbyPlace {
    name: string;
    type: string;
    distance: number;
    lat: number;
    lng: number;
    address: string;
}

export const geocodeAddress = async (location: string, postCode: string): Promise<GeocodingResult | null> => {
    try {
        const API_KEY = config.server_map_api_key;

        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location + " " + postCode)}&key=${API_KEY}`);

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
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};

export const findNearbyPlaces = async (lat: number, lng: number): Promise<NearbyPlace[]> => {
    try {
        const API_KEY = config.server_map_api_key;

        // Search for each important type separately with small radius
        const placeTypes = ["train_station", "bus_station", "subway_station", "airport", "hospital", "pharmacy", "shopping_mall", "supermarket", "restaurant", "cafe", "park", "convenience_store"];

        const nearbyPlaces: NearbyPlace[] = [];

        for (const placeType of placeTypes) {
            try {
                const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=160934&type=${placeType}&key=${API_KEY}`);

                if (response.data.status === "OK" && response.data.results.length > 0) {
                    // Find the closest result for this type
                    let closestPlace = null;
                    let minDistance = Infinity;

                    response.data.results.forEach((place: any) => {
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
                await new Promise((resolve) => setTimeout(resolve, 200));
            } catch (typeError) {
                console.error(`Error searching for ${placeType}:`, typeError);
                continue;
            }
        }

        // Sort by distance and return
        return nearbyPlaces.sort((a, b) => a.distance - b.distance);
    } catch (error) {
        console.error("Nearby places search error:", error);
        return [];
    }
};

const calculateDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};
