// src/routes/accountRoutes.js
import { Router } from 'express';
import {
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount
} from '../controllers/accountController.js';

const router = Router();

// POST /accounts - create a new account
router.post('/', createAccount);

// GET /accounts/:id - get a single account
router.get('/:id', getAccountById);

// PUT /accounts/:id - update an account
router.put('/:id', updateAccount);

// DELETE /accounts/:id - delete an account
router.delete('/:id', deleteAccount);

export default router;
