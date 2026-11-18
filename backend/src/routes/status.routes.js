const express = require('express');
const router = express.Router();

/**
 * @route   GET /
 * @desc    Root status endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mini Location Notification App backend is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /status
 * @desc    Server status check
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
