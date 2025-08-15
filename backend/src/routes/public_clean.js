import express from 'express';
import { body, query, param } from 'express-validator';
import {
  getAllVenues,
  getVenueDetails,
  getCourtsBySport,
  getPopularVenues,
  getAvailableSports,
  getSportPricing,
  getAvailableTimeSlots,
} from '../controllers/publicController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)

// Get all venues with search and filters
router.get(
  '/venues',
  [
    query('search').optional().isString().trim(),
    query('location').optional().isString().trim(),
    query('sportType').optional().isString().trim(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('amenities').optional().isArray(),
    query('sortBy').optional().isIn(['rating', 'price', 'name', 'location']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getAllVenues
);

// Get venue details with courts and availability
router.get(
  '/venues/:venueId',
  [param('venueId').isInt(), query('date').optional().isISO8601()],
  getVenueDetails
);

// Get courts by sport type
router.get(
  '/sports/:sportType/courts',
  [
    param('sportType').isString().trim(),
    query('location').optional().isString().trim(),
    query('date').optional().isISO8601(),
    query('startTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    query('endTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getCourtsBySport
);

// Get popular venues
router.get(
  '/venues/popular/list',
  [
    query('type').optional().isIn(['rating', 'bookings', 'recent']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  getPopularVenues
);

// Get available sports
router.get('/sports', getAvailableSports);

// Get sport pricing for specific venue and sport
router.get(
  '/venues/:venueId/sports/:sportType/pricing',
  [param('venueId').isInt(), param('sportType').isString().trim()],
  getSportPricing
);

// Get available time slots for a court on a specific date
router.get(
  '/courts/:courtId/available-slots',
  [
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    query('date').isDate({ format: 'YYYY-MM-DD' }).withMessage('Date must be in YYYY-MM-DD format'),
  ],
  getAvailableTimeSlots
);

export default router;
