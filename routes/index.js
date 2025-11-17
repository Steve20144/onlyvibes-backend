import { Router } from 'express';
import accountRoutes from './accountRoutes.js';
import eventRoutes from './eventRoutes.js';
import searchRoutes from './searchRoutes.js';

const router = Router();

router.use('/accounts', accountRoutes);
router.use('/events', eventRoutes);
router.use('/search', searchRoutes);

export default router;
