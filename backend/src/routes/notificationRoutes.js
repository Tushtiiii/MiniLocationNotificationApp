const express = require('express');
const router = express.Router();
const {
  registerDevice,
  sendNotification,
} = require('../controllers/notificationController');

/**
 * @route   POST /api/notifications/register
 * @desc    Register device FCM token for push notifications
 * @access  Public
 */
router.post('/register', registerDevice);

/**
 * @route   POST /api/notifications/send
 * @desc    Send push notification to all registered devices
 * @access  Public
 */
router.post('/send', sendNotification);

// Also support full path if mounted at /api directly
router.post('/notifications/register', registerDevice);
router.post('/notifications/send', sendNotification);

module.exports = router;
