/**
 * Location API Types
 */

export interface LocationPayload {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface LocationApiResponse {
  success: boolean;
  message: string;
  data?: LocationPayload;
}
