import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Test authentication endpoint
router.get('/test-auth', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Test role-based access
router.get('/test-facility-owner', authenticate, requireRole(['facility_owner', 'admin']), (req, res) => {
  res.json({
    success: true,
    message: 'Facility owner/admin access successful',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;
