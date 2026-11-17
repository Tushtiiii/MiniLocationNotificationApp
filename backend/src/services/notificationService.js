const { getMessagingInstance, isFirebaseConfigured } = require('../config/firebase');

// In-memory token storage (using Set to automatically prevent duplicate tokens)
const registeredTokens = new Set();

/**
 * Register a device FCM token in memory.
 * 
 * @param {string} token - The FCM registration token
 * @returns {object} Registration status details
 */
const registerDeviceToken = (token) => {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('A valid, non-empty FCM device token string is required.');
  }

  const trimmedToken = token.trim();
  const isAlreadyRegistered = registeredTokens.has(trimmedToken);

  if (!isAlreadyRegistered) {
    registeredTokens.add(trimmedToken);
  }

  return {
    success: true,
    token: trimmedToken,
    isNew: !isAlreadyRegistered,
    totalRegisteredDevices: registeredTokens.size,
    message: isAlreadyRegistered
      ? 'Token is already registered.'
      : 'Device token registered successfully.',
  };
};

/**
 * Unregister a device FCM token.
 * 
 * @param {string} token 
 * @returns {boolean} Whether the token was removed
 */
const unregisterDeviceToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  return registeredTokens.delete(token.trim());
};

/**
 * Get all currently registered device tokens.
 * 
 * @returns {string[]} Array of FCM tokens
 */
const getRegisteredTokens = () => {
  return Array.from(registeredTokens);
};

/**
 * Clear all registered tokens (useful for testing).
 */
const clearRegisteredTokens = () => {
  registeredTokens.clear();
};

/**
 * Send push notification to all registered devices using Firebase Cloud Messaging.
 * Handles invalid, stale, or expired tokens by pruning them from the in-memory store.
 * 
 * @param {object} payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {object} [payload.data] - Optional custom key-value data
 * @returns {Promise<object>} Send results
 */
const sendPushNotification = async ({ title, body, data = {} }) => {
  // Check if Firebase Admin SDK is configured
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      unavailable: true,
      message: 'Firebase Admin is not configured. Service account credentials are missing in the server environment.',
    };
  }

  // Ensure there are registered devices
  const tokens = getRegisteredTokens();
  if (tokens.length === 0) {
    return {
      success: false,
      noRecipients: true,
      message: 'No registered devices found. Register at least one device token before sending notifications.',
      totalRecipients: 0,
    };
  }

  // Construct FCM payload formatted for mobile platforms (including iOS APNs settings)
  const messagePayload = {
    tokens,
    notification: {
      title,
      body,
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    // Send to multicast recipients using sendEachForMulticast
    const messaging = getMessagingInstance();
    const batchResponse = await messaging.sendEachForMulticast(messagePayload);

    const expiredTokens = [];

    // Identify stale, invalid, or expired tokens
    batchResponse.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        // FCM error codes for expired/invalid tokens
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          expiredTokens.push(tokens[idx]);
        }
      }
    });

    // Prune invalid or expired tokens
    expiredTokens.forEach((badToken) => {
      registeredTokens.delete(badToken);
    });

    return {
      success: batchResponse.successCount > 0,
      successCount: batchResponse.successCount,
      failureCount: batchResponse.failureCount,
      totalDevices: tokens.length,
      prunedStaleTokens: expiredTokens.length,
      activeRemainingDevices: registeredTokens.size,
      message: batchResponse.successCount > 0
        ? `Notification sent successfully to ${batchResponse.successCount} of ${tokens.length} device(s).`
        : `Failed to deliver notification to any of the ${tokens.length} device(s).`,
      errors: batchResponse.responses
        .filter((r) => !r.success)
        .map((r) => r.error?.message || 'Delivery error'),
    };
  } catch (error) {
    console.error('❌ [FCM Error] Error sending multicast message:', error);
    return {
      success: false,
      message: `Failed to send push notifications: ${error.message}`,
      error: error.message,
    };
  }
};

module.exports = {
  registerDeviceToken,
  unregisterDeviceToken,
  getRegisteredTokens,
  clearRegisteredTokens,
  sendPushNotification,
};
