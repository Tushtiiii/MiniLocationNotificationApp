import { Platform } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from 'react-native-notify-kit';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

export const NOTIFICATION_CHANNEL_ID = 'default';

/**
 * Creates the Android notification channel used for foreground FCM messages.
 * Must be called once before displaying any local notification on Android 8+.
 */
export async function createNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'General Notifications',
    importance: AndroidImportance.HIGH,
  });
}

/**
 * Registers the device FCM token with the backend so it can receive pushes.
 *
 * @param token - The FCM registration token
 * @throws Error when the network fails or the server responds with a non-2xx status
 */
async function registerTokenWithBackend(token: string): Promise<void> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_REGISTER}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.message || `Token registration failed with HTTP ${response.status}`,
    );
  }
}

/**
 * Displays an FCM message as a local notification while the app is in the foreground.
 * FCM does not auto-display notifications in the foreground, so we render them
 * through the local notification library instead.
 *
 * @param remoteMessage - The message received from Firebase
 */
async function displayForegroundNotification(
  remoteMessage: RemoteMessage,
): Promise<void> {
  const { notification, data } = remoteMessage;

  await notifee.displayNotification({
    title: notification?.title ?? 'Notification',
    body: notification?.body ?? '',
    data: data as Record<string, string>,
    android: {
      channelId: NOTIFICATION_CHANNEL_ID,
      pressAction: {
        id: 'default',
      },
    },
  });
}

/**
 * Requests notification permission, retrieves the FCM token, and registers it
 * with the backend. Also wires up token refresh and foreground message handling.
 *
 * Should be called once on app startup (e.g. in App.tsx).
 *
 * @returns Promise resolving to the registered FCM token, or null when
 *          permission was denied or token retrieval failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    await createNotificationChannel();

    const messaging = getMessaging();

    // Request permission (required on Android 13+ and iOS)
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL ||
      authStatus === AuthorizationStatus.EPHEMERAL;

    if (!enabled) {
      console.warn('⚠️  [Notifications] Permission not granted.');
      return null;
    }

    // Retrieve and register the current FCM token
    const token = await getToken(messaging);
    if (!token) {
      console.warn('⚠️  [Notifications] Empty FCM token received.');
      return null;
    }

    await registerTokenWithBackend(token);
    console.log('✅ [Notifications] Device token registered with backend.');

    // Re-register automatically whenever FCM rotates the token
    onTokenRefresh(messaging, async newToken => {
      try {
        await registerTokenWithBackend(newToken);
        console.log('✅ [Notifications] Refreshed token registered with backend.');
      } catch (err) {
        console.warn('⚠️  [Notifications] Failed to register refreshed token:', err);
      }
    });

    // Display notifications that arrive while the app is in the foreground
    onMessage(messaging, async remoteMessage => {
      try {
        await displayForegroundNotification(remoteMessage);
      } catch (err) {
        console.warn('⚠️  [Notifications] Failed to display foreground message:', err);
      }
    });

    return token;
  } catch (error) {
    console.warn('⚠️  [Notifications] Push registration failed:', error);
    return null;
  }
}
