// src/controllers/accountController.js
import {
  createAccountService,
  getAccountByIdService,
  updateAccountService,
  deleteAccountService
} from '../services/accountService.js';

/**
 * Simple email validation helper.
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Create a new account.
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const createAccount = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;

    // ✅ Basic validation so the tests pass and API behaves nicely
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: null,
        message: 'Invalid or missing email'
      });
    }

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        data: null,
        error: null,
        message: 'Invalid or missing name'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({
        success: false,
        data: null,
        error: null,
        message: 'Password must be at least 4 characters'
      });
    }

    if (!['user', 'venue'].includes(role)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: null,
        message: 'Role must be "user" or "venue"'
      });
    }

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
 * Get a single account by id.
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
 * Update an account by id.
 */
export const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateAccountService(id, req.body);

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
 * Delete an account by id.
 * (Use 200 so we can send {success, data, error, message})
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
