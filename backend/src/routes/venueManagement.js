import express from 'express';
import { body, param, query } from 'express-validator';
import { getDashboard } from '../controllers/venueController.js';
import {
  getVenues,
  createVenue,
  getVenue,
  updateVenue,
  deleteVenue,
} from '../controllers/venueController.js';
import {
  getCourts,
  createCourt,
  updateCourt,
  deleteCourt,
  toggleCourtStatus,
  getAllOwnerCourts,
  createOwnerCourt,
  updateOwnerCourt,
  deleteOwnerCourt,
  toggleOwnerCourtStatus,
} from '../controllers/courtController.js';
import {
  setVenueWorkingHours,
  getVenueWorkingHours,
  generateVenueTimeSlots,
  generateCourtTimeSlots,
  createCourtTimeSlots,
  updateCourtTimeSlot,
  deleteCourtTimeSlot,
  getCourtTimeSlots,
} from '../controllers/timeSlotController.js';
import { getBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { getVenueOwnerReviews } from '../controllers/reviewController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadVenueImages, uploadCourtImages } from '../config/cloudinary.js';
import { validateJsonField, validateNestedArrayField, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication and venue owner role check to all routes
router.use(authenticate);
router.use(requireRole(['facility_owner', 'admin']));

// DASHBOARD
router.get('/dashboard', getDashboard);

// REVIEWS MANAGEMENT
router.get('/reviews', [
  query('venueId').optional().isInt({ min: 1 }).withMessage('Valid venue ID required'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater'),
  query('sortBy').optional().isIn(['createdAt', 'rating', 'helpfulCount']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
], getVenueOwnerReviews);

// COURTS MANAGEMENT (All courts for the facility owner)
router.get('/courts', getAllOwnerCourts);

// Create court (general endpoint)
router.post(
  '/courts',
  [
    body('venueId').isInt({ min: 1 }).withMessage('Valid venue ID is required'),
    body('name')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Court name must be between 3 and 255 characters'),
    body('sportType').trim().isLength({ min: 1 }).withMessage('Sport type is required'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('pricePerHour')
      .isFloat({ min: 0.01 })
      .withMessage('Price per hour must be a positive number'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  ],
  createOwnerCourt
);

// Update court (general endpoint)
router.put(
  '/courts/:courtId',
  [
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Court name must be between 3 and 255 characters'),
    body('sportType').optional().trim().isLength({ min: 1 }).withMessage('Sport type is required'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('pricePerHour')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Price per hour must be a positive number'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer'),
  ],
  updateOwnerCourt
);

// Delete court (general endpoint)
router.delete(
  '/courts/:courtId',
  [param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID')],
  deleteOwnerCourt
);

// Toggle court status (general endpoint)
router.patch(
  '/courts/:courtId/toggle-status',
  [param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID')],
  toggleOwnerCourtStatus
);

// VENUE MANAGEMENT
router.get('/venues', getVenues);

router.post(
  '/venues',
  uploadVenueImages.array('venueImages', 5), // Allow up to 5 venue images
  [
    body('name')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Venue name must be between 3 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('address')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Address must be between 10 and 500 characters'),
    body('location')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Location must be between 3 and 255 characters'),
    body('contactPhone')
      .trim()
      .isLength({ min: 10, max: 20 })
      .withMessage('Contact phone must be between 10 and 20 characters'),
    body('contactEmail')
      .trim()
      .isEmail()
      .withMessage('Contact email must be a valid email address'),
    validateJsonField('amenities', 'Amenities must be a valid array'),
    validateNestedArrayField('courts', 'name', { minLength: 1, maxLength: 100 }),
    validateNestedArrayField('courts', 'sportType', { minLength: 3, maxLength: 50 }),
    body('courts').custom((value) => {
      if (!value) return true;
      
      let arrayValue = value;
      if (typeof value === 'string') {
        try {
          arrayValue = JSON.parse(value);
        } catch (error) {
          throw new Error('Courts must be valid JSON');
        }
      }
      
      if (!Array.isArray(arrayValue)) {
        throw new Error('Courts must be an array');
      }
      
      arrayValue.forEach((court, index) => {
        if (!court.pricePerHour || isNaN(court.pricePerHour) || court.pricePerHour <= 0) {
          throw new Error(`Court ${index + 1}: Price per hour must be a positive number`);
        }
      });
      
      return true;
    }),
  ],
  createVenue
);

router.get(
  '/venues/:venueId',
  [param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID')],
  getVenue
);

router.put(
  '/venues/:venueId',
  uploadVenueImages.array('newImages', 5), // Allow up to 5 new venue images
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Venue name must be between 3 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('address')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Address must be between 10 and 500 characters'),
    body('location')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Location must be between 3 and 255 characters'),
  ],
  handleValidationErrors,
  updateVenue
);

router.delete(
  '/venues/:venueId',
  [param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID')],
  deleteVenue
);

// COURT MANAGEMENT
router.get(
  '/venues/:venueId/courts',
  [param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID')],
  getCourts
);

router.post(
  '/venues/:venueId/courts',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    body('name')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Court name must be between 3 and 255 characters'),
    body('sportType')
      .trim()
      .isIn([
        'badminton',
        'tennis',
        'squash',
        'basketball',
        'football',
        'cricket',
        'table_tennis',
        'volleyball',
      ])
      .withMessage('Invalid sport type'),
    body('pricePerHour')
      .isFloat({ min: 0.01 })
      .withMessage('Price per hour must be a positive number'),
    body('operatingHours').optional().isObject().withMessage('Operating hours must be an object'),
    body('operatingHours.start')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Start time must be in HH:MM format'),
    body('operatingHours.end')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('End time must be in HH:MM format'),
  ],
  createCourt
);

router.put(
  '/venues/:venueId/courts/:courtId',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Court name must be between 3 and 255 characters'),
    body('sportType')
      .optional()
      .trim()
      .isIn([
        'badminton',
        'tennis',
        'squash',
        'basketball',
        'football',
        'cricket',
        'table_tennis',
        'volleyball',
      ])
      .withMessage('Invalid sport type'),
    body('pricePerHour')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Price per hour must be a positive number'),
    body('operatingHours').optional().isObject().withMessage('Operating hours must be an object'),
  ],
  updateCourt
);

router.delete(
  '/venues/:venueId/courts/:courtId',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
  ],
  deleteCourt
);

router.patch(
  '/venues/:venueId/courts/:courtId/toggle-status',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
  ],
  toggleCourtStatus
);

// TIME SLOT MANAGEMENT

// Get venue working hours
router.get(
  '/venues/:venueId/working-hours',
  [param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID')],
  getVenueWorkingHours
);

// Set venue working hours
router.post(
  '/venues/:venueId/working-hours',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    body('workingHours').isArray().withMessage('Working hours must be an array'),
    body('workingHours.*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    body('workingHours.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Start time must be in HH:MM:SS format'),
    body('workingHours.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('End time must be in HH:MM:SS format'),
  ],
  setVenueWorkingHours
);

// Generate time slots for venue
router.post(
  '/venues/:venueId/generate-slots',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    body('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  generateVenueTimeSlots
);

// Create time slots for a court
router.post(
  '/venues/:venueId/courts/:courtId/time-slots',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    body('timeSlots').isArray({ min: 1 }).withMessage('timeSlots must be a non-empty array'),
    body('timeSlots.*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be between 0 and 6'),
    body('timeSlots.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('startTime must be in HH:MM format'),
    body('timeSlots.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('endTime must be in HH:MM format'),
    body('timeSlots.*.isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean')
  ],
  createCourtTimeSlots
);

// Get court time slots for management
router.get(
  '/venues/:venueId/courts/:courtId/time-slots',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    query('date').optional().isISO8601(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  getCourtTimeSlots
);

// Update a specific time slot
router.put(
  '/venues/:venueId/courts/:courtId/time-slots/:slotId',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    param('slotId').isInt({ min: 1 }).withMessage('Invalid slot ID'),
    body('dayOfWeek').optional().isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be between 0 and 6'),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('startTime must be in HH:MM format'),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('endTime must be in HH:MM format'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean')
  ],
  updateCourtTimeSlot
);

// Delete a specific time slot
router.delete(
  '/venues/:venueId/courts/:courtId/time-slots/:slotId',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    param('slotId').isInt({ min: 1 }).withMessage('Invalid slot ID')
  ],
  deleteCourtTimeSlot
);

// Generate default time slots for a court
router.post(
  '/venues/:venueId/courts/:courtId/time-slots/generate-default',
  [
    param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    param('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
    body('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    body('operatingHours').optional().isObject(),
    body('operatingHours.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
    body('operatingHours.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
    body('slotDuration').optional().isInt({ min: 15, max: 480 }).withMessage('Slot duration must be between 15 and 480 minutes'),
    body('daysOfWeek').optional().isArray().withMessage('Days of week must be an array'),
    body('daysOfWeek.*').optional().isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6')
  ],
  generateCourtTimeSlots
);

// BOOKING MANAGEMENT
router.get(
  '/bookings',
  [
    query('status')
      .optional()
      .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
      .withMessage('Invalid status'),
    query('venueId').optional().isInt({ min: 1 }).withMessage('Invalid venue ID'),
    query('courtId').optional().isInt({ min: 1 }).withMessage('Invalid court ID'),
    query('date').optional().isDate().withMessage('Date must be in YYYY-MM-DD format'),
    query('startDate').optional().isDate().withMessage('Start date must be in YYYY-MM-DD format'),
    query('endDate').optional().isDate().withMessage('End date must be in YYYY-MM-DD format'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
  ],
  getBookings
);

router.patch(
  '/bookings/:bookingId/status',
  [
    param('bookingId').isInt({ min: 1 }).withMessage('Invalid booking ID'),
    body('status')
      .isIn(['confirmed', 'cancelled'])
      .withMessage('Status must be confirmed or cancelled'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Reason must be between 3 and 255 characters'),
  ],
  updateBookingStatus
);

export default router;
