import express from 'express';
import { body, query, param } from 'express-validator';
import {
  getUserBookings,
  createBooking,
  cancelBooking,
  rescheduleBooking,
  getBookingDetails,
} from '../controllers/customerBookingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's bookings
router.get(
  '/',
  [
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('upcoming').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getUserBookings
);

// Create a new booking
router.post(
  '/',
  [
    body('venueId').isInt().withMessage('Venue ID is required'),
    body('courtId').isInt().withMessage('Court ID is required'),
    body('bookingDate').isISO8601().withMessage('Valid booking date is required'),
    body('startTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid start time is required (HH:mm format)'),
    body('endTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid end time is required (HH:mm format)'),
    body('totalAmount').optional().isFloat({ min: 0 }),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
  ],
  createBooking
);

// Get booking details
router.get('/:bookingId', [param('bookingId').isInt()], getBookingDetails);

// Cancel a booking
router.patch(
  '/:bookingId/cancel',
  [param('bookingId').isInt(), body('reason').optional().isString().trim().isLength({ max: 500 })],
  cancelBooking
);

// Reschedule a booking
router.patch(
  '/:bookingId/reschedule',
  [
    param('bookingId').isInt(),
    body('newDate').isISO8601().withMessage('Valid new date is required'),
    body('newStartTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid new start time is required (HH:mm format)'),
    body('newEndTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid new end time is required (HH:mm format)'),
  ],
  rescheduleBooking
);

export default router;
