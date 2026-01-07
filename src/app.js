// src/app.js
import express from 'express';
import cors from 'cors';

import accountRoutes from './routes/accountRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import authRoutes from './routes/authRoutes.js';   // ⬅️ NEW
import { logRequest } from './utils/logger.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

/**
 * Global middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 🔍 Custom request logging middleware
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
 * Health check
 */
app.get('/health', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: { status: 'ok' },
    error: null,
    message: 'OnlyVibes API is healthy'
  });
});

/**
 * Routes
 *
 * NOTE:
 * - accountRoutes is mounted at /accounts
 * - eventRoutes is mounted at /events
 * - reviewRoutes defines its own base path internally (as before)
 * - authRoutes defines /auth/signup and /auth/login inside the router
 */
app.use('/accounts', accountRoutes);
app.use('/events', eventRoutes);
app.use(reviewRoutes);
app.use(authRoutes); // ⬅️ NEW: exposes /auth/signup and /auth/login

/**
 * 404 handler
 */
app.use((req, res, _next) => {
  return res.status(404).json({
    success: false,
    data: null,
    error: { path: req.originalUrl },
    message: 'Route not found'
  });
});

/**
 * Centralized error handler
 */
app.use((err, _req, res, _next) => {
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
