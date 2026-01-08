// src/routes/authRoutes.js
import express from 'express';
import { signup, login } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /auth/signup
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/auth/signup', signup);

/**
 * @route   POST /auth/login
 * @desc    Authenticate a user and return a JWT
 * @access  Public
 */
router.post('/auth/login', login);

export default router;
