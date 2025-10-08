// services/geocodingService.ts
import axios from "axios";

export interface GeocodingResult {
    lat: number;
    lng: number;
    formattedAddress: string;
}

export const geocodeAddress = async (location: string, postCode: string): Promise<GeocodingResult | null> => {
    try {
        // FREE API KEY - Use this demo key
        const API_KEY = "0b675b5f64548b2f56b1c7c46c8b8b8a"; // PositionStack free demo key

        const response = await axios.get(`http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${encodeURIComponent(location + " " + postCode)}&country=US&limit=1`);

        console.log("PositionStack response:", response.data);

        if (response.data.data && response.data.data.length > 0) {
            const result = response.data.data[0];

            // Only return if we have valid coordinates
            if (result.latitude && result.longitude) {
                return {
                    lat: result.latitude,
                    lng: result.longitude,
                    formattedAddress: result.label || `${location}, ${postCode}`,
                };
            }
        }

        // NO FALLBACK - return null if no coordinates found
        console.log("No coordinates found for:", location, postCode);
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        // NO FALLBACK - return null on error
        return null;
    }
};
