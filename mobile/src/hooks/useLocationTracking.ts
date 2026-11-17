import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { sendLocation } from '../services/locationService';

export interface UseLocationTrackingReturn {
  isTracking: boolean;
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

const UPDATE_INTERVAL_MS = 4000;

/**
 * Custom hook for foreground location tracking.
 * Obtains GPS coordinates approximately every 4 seconds and sends them to the backend API.
 */
export const useLocationTracking = (): UseLocationTrackingReturn => {
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to control async flow and prevent overlapping requests
  const isTrackingRef = useRef<boolean>(false);
  const isUpdatingRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Request device location permissions for Android and iOS.
   */
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await Geolocation.requestAuthorization('whenInUse');
        return authStatus === 'granted';
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This application requires access to your location while open to sync coordinates with the server.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return false;
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  };

  /**
   * Fetch current GPS location and send coordinates to backend.
   */
  const fetchAndSyncLocation = useCallback(async () => {
    // Prevent overlapping requests or execution after tracking stopped
    if (!isTrackingRef.current || isUpdatingRef.current) {
      return;
    }

    isUpdatingRef.current = true;

    Geolocation.getCurrentPosition(
      async position => {
        // If tracking was stopped while waiting for GPS fix, discard update
        if (!isTrackingRef.current) {
          isUpdatingRef.current = false;
          return;
        }

        const { latitude: currentLat, longitude: currentLng } = position.coords;

        setLatitude(currentLat);
        setLongitude(currentLng);

        try {
          // Send location coordinates to the backend service
          await sendLocation(currentLat, currentLng);
          setError(null);
        } catch (apiErr) {
          const message =
            apiErr instanceof Error
              ? apiErr.message
              : 'Failed to send location update to server.';
          setError(message);
        } finally {
          isUpdatingRef.current = false;
        }
      },
      geoErr => {
        if (!isTrackingRef.current) {
          isUpdatingRef.current = false;
          return;
        }

        let message = `Location error: ${geoErr.message}`;
        if (geoErr.code === 1) {
          message = 'Location permission denied.';
        } else if (geoErr.code === 2) {
          message = 'Location provider unavailable. Please turn on GPS/Location services.';
        } else if (geoErr.code === 3) {
          message = 'Location request timed out.';
        }

        setError(message);
        isUpdatingRef.current = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      },
    );
  }, []);

  /**
   * Start tracking: verifies permissions, sets interval, and triggers updates.
   */
  const startTracking = useCallback(async () => {
    if (isTrackingRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission was denied. Cannot start tracking.');
      setIsLoading(false);
      return;
    }

    isTrackingRef.current = true;
    setIsTracking(true);
    setIsLoading(false);

    // Initial immediate update
    fetchAndSyncLocation();

    // Periodic updates every ~4 seconds
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      fetchAndSyncLocation();
    }, UPDATE_INTERVAL_MS);
  }, [fetchAndSyncLocation]);

  /**
   * Stop tracking: clears timer and active requests.
   */
  const stopTracking = useCallback(() => {
    isTrackingRef.current = false;
    isUpdatingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsTracking(false);
    setIsLoading(false);
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    isTracking,
    latitude,
    longitude,
    isLoading,
    error,
    startTracking,
    stopTracking,
  };
};
