import axios from "axios";
import config from "../../config";

export interface GeocodingResult {
    lat: number;
    lng: number;
    formattedAddress: string;
}

export const geocodeAddress = async (location: string, postCode: string): Promise<GeocodingResult | null> => {
    try {
        const API_KEY = config.map_api_key;

        // Remove country restriction or set to Bangladesh for BD addresses
        const response = await axios.get(`http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${encodeURIComponent(location + " " + postCode)}&limit=1`);

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
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};
