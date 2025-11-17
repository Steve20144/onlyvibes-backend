import { Router } from 'express';
import { basicAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validation.js';
import { searchQuery } from '../utils/validators.js';
import { searchController } from '../controllers/searchController.js';

const router = Router();

router.get('/', basicAuth, searchQuery(), handleValidation, searchController);

export default router;
