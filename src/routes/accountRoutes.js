// src/routes/accountRoutes.js
import { Router } from 'express';
import {
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount
} from '../controllers/accountController.js';

const router = Router();

/**
 * @route   POST /accounts
 * @desc    Create a new account
 * @access  Public
 */
router.post('/', createAccount);

/**
 * @route   GET /accounts/:id
 * @desc    Get a single account by its ID
 * @access  Public
 */
router.get('/:id', getAccountById);

/**
 * @route   PUT /accounts/:id
 * @desc    Update an account by its ID
 * @access  Private (requires authentication and ownership)
 */
router.put('/:id', updateAccount);

/**
 * @route   DELETE /accounts/:id
 * @desc    Delete an account by its ID
 * @access  Private (requires authentication and ownership)
 */
router.delete('/:id', deleteAccount);

export default router;
