/**
 * API Configuration Constants
 *
 * NOTE ON HOST CONFIGURATION:
 * - Android Emulator: Uses 'http://10.0.2.2:5000'. The Android emulator runs in an isolated
 *   virtual network. Using 'localhost' inside the Android emulator resolves to the emulator's
 *   own loopback interface, NOT your development computer. The special IP '10.0.2.2' is an
 *   alias provided by the emulator that maps directly to the host machine's loopback interface.
 *
 * - Physical Android / iOS Device: If running on a physical device connected over Wi-Fi,
 *   you MUST replace this with your computer's local network IP address (e.g., 'http://192.168.1.X:5000').
 *
 * - iOS Simulator: 'http://localhost:5000' can be used because the iOS simulator shares
 *   the host network stack directly.
 */

export const API_BASE_URL = 'http://10.0.2.2:5000';

export const API_ENDPOINTS = {
  LOCATION: '/api/location',
  HEALTH: '/api/health',
} as const;
