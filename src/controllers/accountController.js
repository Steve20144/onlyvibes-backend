// src/controllers/accountController.js
import {
  createAccountService,
  getAccountByIdService,
  updateAccountService,
  deleteAccountService
} from '../services/accountService.js';

/**
 * Create a new account.
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const createAccount = async (req, res, next) => {
  try {
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
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
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
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
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
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
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

    return res.status(204).json({
      success: true,
      data: null,
      error: null,
      message: 'Account deleted'
    });
  } catch (error) {
    return next(error);
  }
};
