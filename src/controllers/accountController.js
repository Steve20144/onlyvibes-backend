// src/controllers/accountController.js
import {
  createAccountService,
  getAccountByIdService,
  updateAccountService,
  deleteAccountService
} from '../services/accountService.js';

/**
 * Simple email validation helper.
 * @param {string} email The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Defines the roles that can be assigned to an account.
const allowedAccountRoles = ['user', 'venue'];

/**
 * Validates the payload for creating a new account.
 * @param {object} payload The request body containing account data.
 * @throws {Error} If validation fails, throws an error with a 400 status code.
 */
const validateAccountPayload = (payload) => {
  const errors = [];

  if (!isValidEmail(payload.email)) {
    errors.push('Invalid or missing email');
  }

  if (!payload.name || typeof payload.name !== 'string') {
    errors.push('Invalid or missing name');
  }

  if (!payload.password || typeof payload.password !== 'string' || payload.password.length < 4) {
    errors.push('Password must be at least 4 characters');
  }

  if (!allowedAccountRoles.includes(payload.role)) {
    errors.push('Role must be "user" or "venue"');
  }

  if (errors.length) {
    const err = new Error(errors[0]);
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Sanitizes and validates the payload for updating an account.
 * It ensures that only allowed fields are updated and that their values are valid.
 * @param {object} payload The request body containing account updates.
 * @returns {object} The sanitized update object.
 * @throws {Error} If the payload is invalid or contains disallowed fields.
 */
const sanitizeAccountUpdates = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const err = new Error('Request body must be a JSON object.');
    err.statusCode = 400;
    throw err;
  }

  // A set of fields that are permitted to be updated.
  const updatableFields = new Set([
    'username',
    'email',
    'password',
    'role',
    'preferences',
    'venueDetails',
    'isVerified'
  ]);

  const sanitized = {};
  let touched = false;

  for (const [key, value] of Object.entries(payload)) {
    if (!updatableFields.has(key)) {
      const err = new Error(`Field "${key}" cannot be updated.`);
      err.statusCode = 400;
      throw err;
    }

    touched = true;

    // Validate and sanitize each field based on its type and constraints.
    switch (key) {
      case 'username': {
        if (typeof value !== 'string' || value.trim().length < 2) {
          const err = new Error('username must be at least 2 characters.');
          err.statusCode = 400;
          throw err;
        }
        sanitized.username = value.trim();
        break;
      }
      case 'email': {
        if (!isValidEmail(value)) {
          const err = new Error('Invalid or missing email');
          err.statusCode = 400;
          throw err;
        }
        sanitized.email = value;
        break;
      }
      case 'password': {
        if (typeof value !== 'string' || value.length < 4) {
          const err = new Error('Password must be at least 4 characters');
          err.statusCode = 400;
          throw err;
        }
        sanitized.password = value;
        break;
      }
      case 'role': {
        if (!allowedAccountRoles.includes(value)) {
          const err = new Error('Role must be "user" or "venue"');
          err.statusCode = 400;
          throw err;
        }
        sanitized.role = value;
        break;
      }
      case 'preferences': {
        if (!Array.isArray(value)) {
          const err = new Error('preferences must be an array of strings');
          err.statusCode = 400;
          throw err;
        }
        sanitized.preferences = value;
        break;
      }
      case 'venueDetails': {
        if (value !== null && typeof value !== 'object') {
          const err = new Error('venueDetails must be an object');
          err.statusCode = 400;
          throw err;
        }
        sanitized.venueDetails = value;
        break;
      }
      case 'isVerified': {
        if (typeof value !== 'boolean') {
          const err = new Error('isVerified must be a boolean');
          err.statusCode = 400;
          throw err;
        }
        sanitized.isVerified = value;
        break;
      }
      default:
        break;
    }
  }

  // Ensure at least one field was provided for update.
  if (!touched) {
    const err = new Error('Provide at least one field to update.');
    err.statusCode = 400;
    throw err;
  }

  return sanitized;
};

/**
 * Handles the creation of a new account.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A JSON response indicating success or failure.
 */
export const createAccount = async (req, res, next) => {
  try {
    validateAccountPayload(req.body);

    const account = await createAccountService(req.body);

    return res.status(201).json({
      success: true,
      data: account,
      error: null,
      message: 'Account created successfully'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieves a single account by its ID.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} The account data or an error message.
 */
export const getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await getAccountByIdService(id);

    if (!account) {
      const err = new Error('Account not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: account,
      error: null,
      message: 'Account retrieved'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates an existing account by its ID.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} The updated account data or an error message.
 */
export const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = sanitizeAccountUpdates(req.body);
    const updated = await updateAccountService(id, updates);

    if (!updated) {
      const err = new Error('Account not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: updated,
      error: null,
      message: 'Account updated'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes an account by its ID.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A confirmation message.
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await deleteAccountService(id);

    if (!deleted) {
      const err = new Error('Account not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: null,
      error: null,
      message: 'Account deleted'
    });
  } catch (error) {
    return next(error);
  }
};
