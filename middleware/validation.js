import { validationResult } from 'express-validator';
import { sendError } from '../utils/responses.js';

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const mapped = errors.array().map(({ msg, param }) => ({ field: param, message: msg }));

  return sendError(res, { statusCode: 422, message: 'Validation failed', error: mapped });
};
