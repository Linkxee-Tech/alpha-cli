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

// Manual CORS Header Injection Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Dynamically allow provided frontend OR keep everything open for development if needed
  const allowedOrigin = process.env.FRONTEND_URL || '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Fast pre-flight response
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: false,
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

// Global Error Handler - ensuring CORS headers on errors
app.use((err, req, res, next) => {
  console.error('SERVER_ERROR:', err);
  
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
