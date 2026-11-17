const {
  registerDeviceToken,
  sendPushNotification,
  getRegisteredTokens,
} = require('../services/notificationService');
const { isFirebaseConfigured } = require('../config/firebase');

/**
 * @desc    Register device FCM token for push notifications
 * @route   POST /api/notifications/register
 * @access  Public
 */
const registerDevice = (req, res) => {
  try {
    const token = req.body.token || req.body.fcmToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required in the request body (token).',
      });
    }

    if (typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Device token must be a valid non-empty string.',
      });
    }

    const registration = registerDeviceToken(token.trim());

    console.log(`\n📲 [Device Registered]`);
    console.log(`   Token: ${registration.token.substring(0, 16)}...`);
    console.log(`   New Registration: ${registration.isNew}`);
    console.log(`   Total Devices: ${registration.totalRegisteredDevices}\n`);

    const statusCode = registration.isNew ? 201 : 200;

    return res.status(statusCode).json({
      success: true,
      message: registration.message,
      data: {
        token: registration.token,
        isNew: registration.isNew,
        totalRegisteredDevices: registration.totalRegisteredDevices,
      },
    });
  } catch (error) {
    console.error('❌ [Register Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register device token.',
      error: error.message,
    });
  }
};

/**
 * @desc    Send push notification to all registered devices
 * @route   POST /api/notifications/send
 * @access  Public
 */
const sendNotification = async (req, res) => {
  try {
    const { title, body, data } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notification title is required and must be a non-empty string.',
      });
    }

    // Validate body
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notification body is required and must be a non-empty string.',
      });
    }

    // Validate data if provided
    if (data !== undefined && (typeof data !== 'object' || Array.isArray(data) || data === null)) {
      return res.status(400).json({
        success: false,
        message: 'Data payload, if provided, must be a key-value object.',
      });
    }

    const result = await sendPushNotification({
      title: title.trim(),
      body: body.trim(),
      data: data || {},
    });

    // Check if Firebase is unconfigured
    if (result.unavailable) {
      return res.status(503).json({
        success: false,
        message: result.message,
      });
    }

    // Check if no recipients are registered
    if (result.noRecipients) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Check if sending failed
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
        errors: result.errors || [],
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalDevices: result.totalDevices,
        prunedStaleTokens: result.prunedStaleTokens,
        activeRemainingDevices: result.activeRemainingDevices,
      },
    });
  } catch (error) {
    console.error('❌ [Send Notification Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification.',
      error: error.message,
    });
  }
};

module.exports = {
  registerDevice,
  sendNotification,
};
