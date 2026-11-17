/**
 * Push Notification Types
 */

export interface NotificationRegistrationResult {
  success: boolean;
  token?: string;
  message: string;
}

export interface NotificationPermissionResult {
  granted: boolean;
  message: string;
}

export interface NotificationState {
  /** Whether notification permissions have been granted */
  permissionGranted: boolean;
  /** The FCM device token, if obtained */
  fcmToken: string | null;
  /** Whether the token has been registered with the backend */
  isRegistered: boolean;
  /** Human-readable status message for the UI */
  statusMessage: string;
  /** Error message, if any */
  error: string | null;
  /** Whether initialization is in progress */
  isInitializing: boolean;
}
