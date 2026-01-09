// src/middleware/error.js

/**
 * Handles requests for routes that are not found (404).
 * This middleware is typically used at the end of the middleware stack.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
function notFound(req, res) {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

/**
 * A generic error-handling middleware for Express.
 * It catches errors passed to `next(err)` and sends a formatted JSON response.
 * The stack trace is included in non-production environments for easier debugging.
 *
 * @param {Error} err - The error object.
 * @param {import('express').Response} res - The Express response object.
 */
function errorHandler(err, res) {
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

export {
  notFound,
  errorHandler,
};
