const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Route imports
const healthRoutes = require('./routes/health.routes');
const statusRoutes = require('./routes/status.routes');
const locationRoutes = require('./routes/locationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Root-level status routes
app.use('/', statusRoutes);

// API routes
app.use('/api', healthRoutes);
app.use('/api', locationRoutes);
app.use('/api/notifications', notificationRoutes);

module.exports = app;
