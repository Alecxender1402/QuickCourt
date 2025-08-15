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
  getAllCourtTimeSlots,
  submitVenueReport,
} from '../controllers/publicController.js';
import { authenticate } from '../middleware/auth.js';

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

// Get operating hours for a venue (public endpoint)
router.get('/venues/:venueId/operating-hours', [
  param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID')
], async (req, res) => {
  try {
    const { venueId } = req.params;
    const prisma = (await import('../config/prisma.js')).default;

    const operatingHours = await prisma.venueWorkingHours.findMany({
      where: { venueId: parseInt(venueId) },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.json({
      success: true,
      data: operatingHours
    });
  } catch (error) {
    console.error('❌ Get public operating hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operating hours',
      error: error.message,
    });
  }
});

// Get existing bookings for a court on a specific date (public endpoint)
router.get('/venues/:venueId/courts/:courtId/bookings', [
  param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
  param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
  query('date').isISO8601().withMessage('Valid date required')
], async (req, res) => {
  try {
    const { venueId, courtId } = req.params;
    const { date } = req.query;
    const prisma = (await import('../config/prisma.js')).default;

    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        venueId: parseInt(venueId),
        courtId: parseInt(courtId),
        bookingDate: {
          gte: targetDate,
          lt: nextDay
        },
        status: {
          in: ['confirmed', 'pending']
        }
      },
      select: {
        startTime: true,
        endTime: true,
        status: true
      },
      orderBy: { startTime: 'asc' }
    });

    // Format time strings for frontend
    const formattedBookings = bookings.map(booking => ({
      startTime: `${booking.startTime.getUTCHours().toString().padStart(2, '0')}:${booking.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
      endTime: `${booking.endTime.getUTCHours().toString().padStart(2, '0')}:${booking.endTime.getUTCMinutes().toString().padStart(2, '0')}`,
      status: booking.status
    }));

    res.json({
      success: true,
      data: formattedBookings
    });
  } catch (error) {
    console.error('❌ Get public bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message,
    });
  }
});

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

// Get all time slots for a court with availability status (including conflicts)
router.get(
  '/courts/:courtId/all-slots',
  [
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    query('date').isDate({ format: 'YYYY-MM-DD' }).withMessage('Date must be in YYYY-MM-DD format'),
  ],
  getAllCourtTimeSlots
);

// Submit venue report (requires authentication)
router.post(
  '/venues/:venueId/report',
  authenticate,
  [
    param('venueId').isInt(),
    body('reason')
      .isIn([
        'inappropriate_content',
        'false_information',
        'safety_concerns',
        'poor_service',
        'facility_issues',
        'other',
      ])
      .withMessage('Invalid report reason'),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
  ],
  submitVenueReport
);

export default router;
