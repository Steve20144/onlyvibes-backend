import { sendError } from '../utils/responses.js';

export const notFoundHandler = (req, res) =>
  sendError(res, { statusCode: 404, message: `Route ${req.originalUrl} not found`, error: 'not_found' });
