// src/routes/authRoutes.js
import express from 'express';
import { signup, login } from '../controllers/authController.js';

const router = express.Router();

// POST /auth/signup
router.post('/auth/signup', signup);

// POST /auth/login
router.post('/auth/login', login);

export default router;
