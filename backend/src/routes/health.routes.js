const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Check health status of the backend server
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
