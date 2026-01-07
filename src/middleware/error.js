// src/middleware/error.js

/**
 * 404 handler for unmatched routes.
 */
function notFound(req, res, _next) {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

/**
 * Generic error handler.
 * 
 * Usage: pass errors to `next(err)` in controllers/services.
 * 
 * Example error object fields:
 * - err.status or err.statusCode for custom status
 * - err.message for human-readable error
 */
function errorHandler(err, _req, res, _next) {
  console.error('Error handler caught:', err);

  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const payload = {
    message: err.message || 'Internal Server Error',
  };

  // Optionally add extra data (e.g. validation errors)
  if (err.errors) {
    payload.errors = err.errors;
  }

  // Show stack only in non-production
  if (!isProduction) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = {
  notFound,
  errorHandler,
};
