// src/app.js
import express from 'express';
import cors from 'cors';

import accountRoutes from './routes/accountRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { logRequest } from './utils/logger.js';

/**
 * The main Express application instance.
 * @type {express.Application}
 */
const app = express();

/**
 * @description Enables Cross-Origin Resource Sharing (CORS) for all routes.
 * This allows requests from any origin.
 */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

/**
 * @description Global middleware for parsing incoming request bodies.
 * It handles JSON payloads and URL-encoded data.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @description Custom middleware for logging incoming requests.
 * It logs the method, URL, status code, and duration of each request.
 * Passwords in the request body are masked for security.
 */
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Mask password if present
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '***';

    // Log request details
    logRequest(
      `${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)
      query: ${JSON.stringify(req.query)}
      body: ${JSON.stringify(safeBody)}`
    );
  });

  next();
});

/**
 * @route   GET /health
 * @desc    Health check endpoint to verify that the API is running.
 * @access  Public
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
 * @description Mounts the application's routes.
 * Each set of routes is handled by a separate router file.
 */
app.use('/accounts', accountRoutes);
app.use('/events', eventRoutes);
app.use(reviewRoutes);
app.use(authRoutes);

/**
 * @description Middleware for handling 404 Not Found errors.
 * This is triggered when a request is made to a non-existent route.
 */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    data: null,
    error: { path: req.originalUrl },
    message: 'Route not found'
  });
});

/**
 * @description Centralized error handling middleware.
 * It catches and processes errors from any part of the application.
 * It sends a formatted JSON response based on the error type.
 */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

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
