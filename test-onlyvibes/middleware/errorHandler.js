import { sendError } from '../utils/responses.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errorPayload = err.details || err.stack;

  return sendError(res, { statusCode, message, error: errorPayload });
};
