import express from 'express';
import { body, query, param } from 'express-validator';
import {
  getAdminDashboard,
  getAllVenuesForReview,
  reviewVenue,
  getAllUsers,
  updateUserStatus,
  getSystemReports,
  getChartData,
  getVenueReports,
  updateReportStatus,
  getReportStats,
} from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Add explicit CORS headers for admin routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(['admin']));

// Admin Dashboard
router.get('/dashboard', getAdminDashboard);

// Get chart data for dashboard
router.get(
  '/chart-data',
  [query('type').optional().isIn(['monthly', 'sports', 'venues'])],
  getChartData
);

// 1. Facility owner/user management - show list and ban/unban
router.get(
  '/users',
  [
    query('role').optional().isIn(['user', 'facility_owner']),
    query('search').optional().isString().trim(),
    query('status').optional().isIn(['active', 'inactive', 'all']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getAllUsers
);

// Ban/Unban users
router.patch(
  '/users/:userId/status',
  [
    param('userId').isInt(),
    body('action').isIn(['suspend', 'activate']).withMessage('Action must be suspend or activate'),
    body('reason').optional().isString().trim().isLength({ max: 500 }),
  ],
  updateUserStatus
);

// 2. Accept/reject facility requests
router.get(
  '/venues',
  [
    query('status').optional().isIn(['pending', 'approved', 'all']),
    query('search').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getAllVenuesForReview
);

// Approve or reject venue requests
router.patch(
  '/venues/:venueId/review',
  [
    param('venueId').isInt(),
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('rejectionReason').optional().isString().trim().isLength({ min: 10, max: 500 }),
  ],
  reviewVenue
);

// 3. See all reports submitted by users for venues/courts
router.get(
  '/reports',
  [
    query('reportType')
      .optional()
      .isIn(['venues', 'users', 'bookings'])
      .withMessage('Valid report type: venues, users, or bookings'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getSystemReports
);

// New venue reports endpoints
router.get(
  '/venue-reports',
  [
    query('status').optional().isIn(['pending', 'reviewed', 'resolved', 'dismissed', 'all']),
    query('sortBy').optional().isIn(['createdAt', 'status', 'reason']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getVenueReports
);

// Update venue report status
router.patch(
  '/venue-reports/:reportId/status',
  [
    param('reportId').isInt(),
    body('status').isIn(['pending', 'reviewed', 'resolved', 'dismissed']),
    body('adminNotes').optional().isString().trim().isLength({ max: 1000 }),
  ],
  updateReportStatus
);

// Get venue report statistics
router.get('/venue-reports/stats', getReportStats);

export default router;
