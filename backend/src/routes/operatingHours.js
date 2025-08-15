import express from 'express';
import { param, body, query } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// Apply authentication and role check
router.use(authenticate);
router.use(requireRole(['facility_owner', 'admin']));

// Set operating hours for a venue
router.post('/venues/:venueId/operating-hours', [
  param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
  body('operatingHours').isArray({ min: 1 }).withMessage('Operating hours must be provided'),
  body('operatingHours.*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be between 0 and 6'),
  body('operatingHours.*.openTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('openTime must be in HH:MM format'),
  body('operatingHours.*.closeTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('closeTime must be in HH:MM format'),
  body('operatingHours.*.isOpen').isBoolean().withMessage('isOpen must be a boolean')
], async (req, res) => {
  try {
    const { venueId } = req.params;
    const { operatingHours } = req.body;

    // Verify user owns the venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        ownerId: req.user.id
      }
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found or you do not have permission to manage it',
      });
    }

    // Clear existing operating hours
    await prisma.venueWorkingHours.deleteMany({
      where: { venueId: parseInt(venueId) }
    });

    // Create new operating hours
    const createData = operatingHours.map(hours => ({
      venueId: parseInt(venueId),
      dayOfWeek: hours.dayOfWeek,
      openTime: hours.openTime,
      closeTime: hours.closeTime,
      isOpen: hours.isOpen
    }));

    await prisma.venueWorkingHours.createMany({
      data: createData
    });

    res.json({
      success: true,
      message: 'Operating hours updated successfully'
    });
  } catch (error) {
    console.error('❌ Set operating hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update operating hours',
      error: error.message,
    });
  }
});

// Get operating hours for a venue
router.get('/venues/:venueId/operating-hours', [
  param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID')
], async (req, res) => {
  try {
    const { venueId } = req.params;

    // Verify user owns the venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        ownerId: req.user.id
      }
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found or you do not have permission to access it',
      });
    }

    const operatingHours = await prisma.venueWorkingHours.findMany({
      where: { venueId: parseInt(venueId) },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.json({
      success: true,
      data: operatingHours
    });
  } catch (error) {
    console.error('❌ Get operating hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operating hours',
      error: error.message,
    });
  }
});

// Get bookings for a venue (organized by day)
router.get('/venues/:venueId/bookings', [
  param('venueId').isInt({ min: 1 }).withMessage('Invalid venue ID'),
  query('date').optional().isISO8601(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const { venueId } = req.params;
    const { date, startDate, endDate } = req.query;

    // Verify user owns the venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        ownerId: req.user.id
      }
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found or you do not have permission to access it',
      });
    }

    // Build date filter
    let dateFilter = {};
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      dateFilter.bookingDate = {
        gte: targetDate,
        lt: nextDay
      };
    } else if (startDate && endDate) {
      dateFilter.bookingDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      // Default to next 30 days
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      dateFilter.bookingDate = {
        gte: today,
        lte: thirtyDaysLater
      };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        venueId: parseInt(venueId),
        ...dateFilter,
        status: {
          in: ['confirmed', 'pending']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true
          }
        }
      },
      orderBy: [
        { bookingDate: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Group bookings by date
    const bookingsByDate = {};
    bookings.forEach(booking => {
      const dateKey = booking.bookingDate.toISOString().split('T')[0];
      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = [];
      }
      
      bookingsByDate[dateKey].push({
        id: booking.id,
        startTime: `${booking.startTime.getUTCHours().toString().padStart(2, '0')}:${booking.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
        endTime: `${booking.endTime.getUTCHours().toString().padStart(2, '0')}:${booking.endTime.getUTCMinutes().toString().padStart(2, '0')}`,
        status: booking.status,
        totalAmount: booking.totalAmount,
        court: booking.court,
        user: booking.user,
        notes: booking.notes
      });
    });

    res.json({
      success: true,
      data: bookingsByDate,
      message: 'Bookings retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Get venue bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message,
    });
  }
});

export default router;
