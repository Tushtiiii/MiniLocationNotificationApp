const express = require('express');
const router = express.Router();
const { recordLocation } = require('../controllers/locationController');

/**
 * @route   POST /api/location
 * @desc    Submit device location update
 * @access  Public
 */
router.post('/location', recordLocation);

// Also handle root if mounted at /api/location
router.post('/', recordLocation);

module.exports = router;
