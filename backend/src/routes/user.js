import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getUserStats } from '../controllers/authController.js';

const router = express.Router();

// User-specific routes (all require authentication)
router.get('/stats', authenticateToken, getUserStats);

export default router;
