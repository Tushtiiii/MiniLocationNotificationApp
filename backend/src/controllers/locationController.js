/**
 * Location Controller
 * Handles receiving and validating GPS location updates from mobile clients.
 */

/**
 * @desc    Receive and validate location coordinates
 * @route   POST /api/location
 * @access  Public
 */
const recordLocation = (req, res) => {
  const { latitude, longitude, timestamp } = req.body;

  // Validate latitude
  if (latitude === undefined || latitude === null) {
    return res.status(400).json({
      success: false,
      message: 'Latitude is required.',
    });
  }

  if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      message: 'Latitude must be a valid number between -90 and 90.',
    });
  }

  // Validate longitude
  if (longitude === undefined || longitude === null) {
    return res.status(400).json({
      success: false,
      message: 'Longitude is required.',
    });
  }

  if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: 'Longitude must be a valid number between -180 and 180.',
    });
  }

  // Validate timestamp
  if (!timestamp) {
    return res.status(400).json({
      success: false,
      message: 'Timestamp is required.',
    });
  }

  const parsedDate = new Date(timestamp);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Timestamp must be a valid date/time format (e.g. ISO 8601 string).',
    });
  }

  // Log location update to terminal
  console.log('\n📍 [Location Update Received]');
  console.log(`   Latitude:  ${latitude}`);
  console.log(`   Longitude: ${longitude}`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Recorded:  ${new Date().toISOString()}\n`);

  // Return success response with received location data
  return res.status(201).json({
    success: true,
    message: 'Location recorded successfully',
    data: {
      latitude,
      longitude,
      timestamp,
    },
  });
};

module.exports = {
  recordLocation,
};
