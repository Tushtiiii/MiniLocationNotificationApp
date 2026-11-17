import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { LocationPayload, LocationApiResponse } from '../types/location';

export type { LocationPayload, LocationApiResponse };

/**
 * Sends device location coordinates and the current timestamp to the backend server.
 *
 * @param latitude - Current latitude coordinate (-90 to 90)
 * @param longitude - Current longitude coordinate (-180 to 180)
 * @returns Promise resolving to the server's LocationApiResponse
 * @throws Error when the network fails or the server responds with a non-2xx status
 */
export async function sendLocation(
  latitude: number,
  longitude: number,
): Promise<LocationApiResponse> {
  // Generate current timestamp using JavaScript Date API
  const timestamp = new Date().toISOString();

  const payload: LocationPayload = {
    latitude,
    longitude,
    timestamp,
  };

  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.LOCATION}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: LocationApiResponse = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.message || `Request failed with HTTP status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while sending location update.');
  }
}
