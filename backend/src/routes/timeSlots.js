import express from 'express';
import { body, query, param } from 'express-validator';
import {
  getAvailableTimeSlots,
  getVenueAvailableTimeSlots,
  setVenueWorkingHours,
  getVenueWorkingHours,
  generateVenueTimeSlots,
  getCourtTimeSlots,
} from '../controllers/timeSlotController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)

// Get available time slots for a court on a specific date
router.get(
  '/courts/:courtId/available-slots',
  [
    param('courtId').isInt(),
    query('date').isISO8601()
  ],
  getAvailableTimeSlots
);

// Get available time slots for all courts in a venue
router.get(
  '/venues/:venueId/available-slots',
  [
    param('venueId').isInt(),
    query('date').isISO8601(),
    query('sportType').optional().isString()
  ],
  getVenueAvailableTimeSlots
);

// Get venue working hours (public info)
router.get(
  '/venues/:venueId/working-hours',
  [param('venueId').isInt()],
  getVenueWorkingHours
);

// Protected routes (authentication required)

// Facility provider routes

// Set venue working hours
router.post(
  '/venues/:venueId/working-hours',
  authenticate,
  [
    param('venueId').isInt(),
    body('workingHours').isArray().withMessage('Working hours must be an array'),
    body('workingHours.*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    body('workingHours.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Start time must be in HH:MM:SS format'),
    body('workingHours.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('End time must be in HH:MM:SS format'),
    body('workingHours.*.isActive').optional().isBoolean()
  ],
  setVenueWorkingHours
);

// Generate time slots for a venue
router.post(
  '/venues/:venueId/generate-slots',
  authenticate,
  [
    param('venueId').isInt(),
    body('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  generateVenueTimeSlots
);

// Get court time slots for management
router.get(
  '/courts/:courtId/time-slots',
  authenticate,
  [
    param('courtId').isInt(),
    query('date').optional().isISO8601(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  getCourtTimeSlots
);

export default router;
