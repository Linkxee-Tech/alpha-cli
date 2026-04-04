require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { startTriggerEngine } = require('./src/services/trigger-engine.service');

// Connect to MongoDB
connectDB();
startTriggerEngine();

const app = express();

// Middleware
// Move CORS before Helmet to handle pre-fights correctly
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false, // If using external resources or subdomains
}));
app.use(express.json());
app.use(morgan('dev'));

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Load Routes (to be implemented)
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/market', require('./src/routes/market.routes'));
app.use('/api/triggers', require('./src/routes/trigger.routes'));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
