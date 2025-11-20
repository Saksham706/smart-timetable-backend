import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// Get dashboard based on user role
router.get('/', getDashboard);

export default router;