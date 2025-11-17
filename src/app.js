// src/app.js
import express from 'express';
import accountRoutes from './routes/accountRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

const app = express();

/**
 * Global middleware
 */
// Parse JSON & URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check
 */
app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    data: { status: 'ok' },
    error: null,
    message: 'OnlyVibes API is healthy'
  });
});

/**
 * Routes
 */
app.use('/accounts', accountRoutes);
app.use('/events', eventRoutes);

/**
 * 404 handler
 */
app.use((req, res, next) => {
  return res.status(404).json({
    success: false,
    data: null,
    error: { path: req.originalUrl },
    message: 'Route not found'
  });
});

/**
 * Centralized error handler
 * (any controller calling next(err) will end up here)
 */
app.use((err, req, res, next) => {
  // Explicit statusCode if provided, otherwise 500
  const statusCode = err.statusCode || 500;

  // Simple differentiation example
  if (statusCode === 400 || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      data: null,
      error: err.errors || null,
      message: err.message || 'Validation error'
    });
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      name: err.name || 'Error',
      details: err.details || null
    },
    message: err.message || 'Internal server error'
  });
});

export default app;
