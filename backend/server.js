const express = require('express');
const cors = require('cors');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('beforeExit', (code) => {
  console.warn(`⚠️ Process beforeExit with code ${code}`);
});

process.on('exit', (code) => {
  console.warn(`⚠️ Process exiting with code ${code}`);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: true, // reflect the request origin
    credentials: true, // allow cookies/authorization headers on web
  })
);
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test database connection on startup
const { pool } = require('./config/database');
const { ensureNotificationsTable } = require('./utils/ensureNotificationsTable');
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully at', res.rows[0].now);
    ensureNotificationsTable()
      .then(() => console.log('✅ Notifications table ready'))
      .catch((e) => console.error('❌ Failed to ensure notifications table:', e));
  }
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MediVault API Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MediVault API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const server = app.listen(PORT, () => {
  const address = server.address();
  const bindInfo = typeof address === 'string' ? address : `${address?.address}:${address?.port}`;
  console.log(`🚀 MediVault API Server running on http://localhost:${PORT}`);
  console.log(`📡 Listening on ${bindInfo}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Database: ${process.env.DB_NAME}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the other process or start with a different port (set PORT env var).`);
    process.exit(1);
  }

  console.error('❌ HTTP server error:', err);
});

server.on('close', () => {
  console.warn('⚠️ HTTP server closed');
});

module.exports = app;
