import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// Create a flexible booking (users can select any start/end time)
router.post('/flexible-booking', authenticate, [
  body('venueId').isInt({ min: 1 }).withMessage('Valid venue ID required'),
  body('courtId').isInt({ min: 1 }).withMessage('Valid court ID required'),
  body('bookingDate').isISO8601().withMessage('Valid date required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('startTime must be in HH:MM format'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('endTime must be in HH:MM format'),
], async (req, res) => {
  try {
    const { venueId, courtId, bookingDate, startTime, endTime, notes } = req.body;
    const userId = req.user.id;

    console.log('🎯 Flexible booking request:', {
      venueId, courtId, bookingDate, startTime, endTime, userId
    });

    // Validate venue exists and is approved
    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        isApproved: true
      }
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found or not approved'
      });
    }

    // Validate court exists and is active
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId),
        venueId: parseInt(venueId),
        isActive: true
      }
    });

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found or not active'
      });
    }

    // Validate time range
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Validate booking date and time are not in the past
    const bookingDateObj = new Date(bookingDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Check if booking date is in the past
    if (bookingDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    // If booking is for today, check if start time is in the past or current time
    if (bookingDateObj.getTime() === today.getTime() && startMinutes <= currentTime) {
      return res.status(400).json({
        success: false,
        message: `Cannot book for past or current times. Current time is ${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2,'0')}. Please select a future time slot.`
      });
    }

    // Validate operating hours
    const dayOfWeek = bookingDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const venueWorkingHours = await prisma.venueWorkingHours.findFirst({
      where: {
        venueId: parseInt(venueId),
        dayOfWeek: dayOfWeek,
        isActive: true
      }
    });

    if (venueWorkingHours) {
      // Convert venue working hours to minutes
      const venueStartTime = venueWorkingHours.startTime;
      const venueEndTime = venueWorkingHours.endTime;
      
      // Extract hours and minutes from time strings (format: HH:MM:SS)
      const [venueStartHour, venueStartMinute] = venueStartTime.split(':').map(Number);
      const [venueEndHour, venueEndMinute] = venueEndTime.split(':').map(Number);
      
      const venueStartMinutes = venueStartHour * 60 + venueStartMinute;
      const venueEndMinutes = venueEndHour * 60 + venueEndMinute;

      // Check if booking start time is before venue opens
      if (startMinutes < venueStartMinutes) {
        const venueOpenTime = `${venueStartHour.toString().padStart(2,'0')}:${venueStartMinute.toString().padStart(2,'0')}`;
        return res.status(400).json({
          success: false,
          message: `Booking time is outside venue operating hours. The venue opens at ${venueOpenTime}.`
        });
      }

      // Check if booking end time is after venue closes
      if (endMinutes > venueEndMinutes) {
        const venueCloseTime = `${venueEndHour.toString().padStart(2,'0')}:${venueEndMinute.toString().padStart(2,'0')}`;
        return res.status(400).json({
          success: false,
          message: `Booking time is outside venue operating hours. The venue closes at ${venueCloseTime}.`
        });
      }
    } else {
      // If no working hours found for this day, venue is closed
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return res.status(400).json({
        success: false,
        message: `The venue is closed on ${days[dayOfWeek]}.`
      });
    }

    // Calculate duration and total cost
    const durationMinutes = endMinutes - startMinutes;
    const durationHours = durationMinutes / 60;
    const totalAmount = durationHours * parseFloat(court.pricePerHour);

    // Check for time conflicts with existing bookings on the same court and date
    const targetDate = new Date(bookingDate);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Create proper time objects for comparison
    const baseDate = new Date('1970-01-01T00:00:00.000Z');
    const startTimeDate = new Date(baseDate);
    startTimeDate.setUTCHours(startHour, startMinute, 0, 0);
    
    const endTimeDate = new Date(baseDate);
    endTimeDate.setUTCHours(endHour, endMinute, 0, 0);

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        courtId: parseInt(courtId),
        bookingDate: {
          gte: targetDate,
          lt: nextDay
        },
        status: {
          in: ['confirmed', 'pending']
        },
        OR: [
          // New booking starts during existing booking
          {
            AND: [
              { startTime: { lte: startTimeDate } },
              { endTime: { gt: startTimeDate } }
            ]
          },
          // New booking ends during existing booking
          {
            AND: [
              { startTime: { lt: endTimeDate } },
              { endTime: { gte: endTimeDate } }
            ]
          },
          // New booking completely contains existing booking
          {
            AND: [
              { startTime: { gte: startTimeDate } },
              { endTime: { lte: endTimeDate } }
            ]
          },
          // Existing booking completely contains new booking
          {
            AND: [
              { startTime: { lte: startTimeDate } },
              { endTime: { gte: endTimeDate } }
            ]
          }
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      const conflicts = conflictingBookings.map(booking => ({
        startTime: `${booking.startTime.getUTCHours().toString().padStart(2, '0')}:${booking.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
        endTime: `${booking.endTime.getUTCHours().toString().padStart(2, '0')}:${booking.endTime.getUTCMinutes().toString().padStart(2, '0')}`
      }));
      
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing bookings',
        conflicts: conflicts
      });
    }

    // Create the booking
    const newBooking = await prisma.booking.create({
      data: {
        userId: userId,
        venueId: parseInt(venueId),
        courtId: parseInt(courtId),
        bookingDate: targetDate,
        startTime: startTimeDate,
        endTime: endTimeDate,
        totalAmount: totalAmount,
        status: 'confirmed', // Auto-confirm for now
        notes: notes || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            pricePerHour: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          id: newBooking.id,
          bookingDate: newBooking.bookingDate.toISOString().split('T')[0],
          startTime: `${newBooking.startTime.getUTCHours().toString().padStart(2, '0')}:${newBooking.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
          endTime: `${newBooking.endTime.getUTCHours().toString().padStart(2, '0')}:${newBooking.endTime.getUTCMinutes().toString().padStart(2, '0')}`,
          duration: `${durationHours} hours`,
          totalAmount: totalAmount,
          status: newBooking.status,
          notes: newBooking.notes,
          user: newBooking.user,
          venue: newBooking.venue,
          court: newBooking.court
        }
      }
    });

  } catch (error) {
    console.error('❌ Flexible booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// Check availability for a time range
router.post('/check-availability', [
  body('venueId').isInt({ min: 1 }).withMessage('Valid venue ID required'),
  body('courtId').isInt({ min: 1 }).withMessage('Valid court ID required'),
  body('bookingDate').isISO8601().withMessage('Valid date required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('startTime must be in HH:MM format'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('endTime must be in HH:MM format'),
], async (req, res) => {
  try {
    const { venueId, courtId, bookingDate, startTime, endTime } = req.body;

    // Get court price
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId),
        venueId: parseInt(venueId),
        isActive: true
      }
    });

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    // Calculate cost
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const durationMinutes = endMinutes - startMinutes;
    const durationHours = durationMinutes / 60;
    const totalAmount = durationHours * parseFloat(court.pricePerHour);

    // Validate booking date and time are not in the past
    const bookingDateObj = new Date(bookingDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Check if booking date is in the past
    if (bookingDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check availability for past dates'
      });
    }

    // If booking is for today, check if start time is in the past or current time
    if (bookingDateObj.getTime() === today.getTime() && startMinutes <= currentTime) {
      return res.status(400).json({
        success: false,
        message: `Cannot check availability for past or current times. Current time is ${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2,'0')}. Please select a future time slot.`
      });
    }

    // Validate operating hours
    const dayOfWeek = bookingDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const venueWorkingHours = await prisma.venueWorkingHours.findFirst({
      where: {
        venueId: parseInt(venueId),
        dayOfWeek: dayOfWeek,
        isActive: true
      }
    });

    if (venueWorkingHours) {
      // Convert venue working hours to minutes
      const venueStartTime = venueWorkingHours.startTime;
      const venueEndTime = venueWorkingHours.endTime;
      
      // Extract hours and minutes from time strings (format: HH:MM:SS)
      const [venueStartHour, venueStartMinute] = venueStartTime.split(':').map(Number);
      const [venueEndHour, venueEndMinute] = venueEndTime.split(':').map(Number);
      
      const venueStartMinutes = venueStartHour * 60 + venueStartMinute;
      const venueEndMinutes = venueEndHour * 60 + venueEndMinute;

      // Check if booking start time is before venue opens
      if (startMinutes < venueStartMinutes) {
        const venueOpenTime = `${venueStartHour.toString().padStart(2,'0')}:${venueStartMinute.toString().padStart(2,'0')}`;
        return res.status(400).json({
          success: false,
          message: `Booking time is outside venue operating hours. The venue opens at ${venueOpenTime}.`,
          isAvailable: false
        });
      }

      // Check if booking end time is after venue closes
      if (endMinutes > venueEndMinutes) {
        const venueCloseTime = `${venueEndHour.toString().padStart(2,'0')}:${venueEndMinute.toString().padStart(2,'0')}`;
        return res.status(400).json({
          success: false,
          message: `Booking time is outside venue operating hours. The venue closes at ${venueCloseTime}.`,
          isAvailable: false
        });
      }
    } else {
      // If no working hours found for this day, venue is closed
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return res.status(400).json({
        success: false,
        message: `The venue is closed on ${days[dayOfWeek]}.`,
        isAvailable: false
      });
    }

    // Check for conflicts
    const targetDate = new Date(bookingDate);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Create proper time objects for comparison
    const baseDate = new Date('1970-01-01T00:00:00.000Z');
    const startTimeDate = new Date(baseDate);
    startTimeDate.setUTCHours(startHour, startMinute, 0, 0);
    
    const endTimeDate = new Date(baseDate);
    endTimeDate.setUTCHours(endHour, endMinute, 0, 0);

    const existingBookings = await prisma.booking.findMany({
      where: {
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
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Check for conflicts
    const hasConflict = existingBookings.some(booking => {
      return (startTimeDate < booking.endTime && endTimeDate > booking.startTime);
    });

    res.json({
      success: true,
      data: {
        isAvailable: !hasConflict,
        duration: `${durationHours} hours`,
        totalAmount: totalAmount,
        pricePerHour: court.pricePerHour,
        existingBookings: existingBookings.map(booking => ({
          startTime: `${booking.startTime.getUTCHours().toString().padStart(2, '0')}:${booking.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
          endTime: `${booking.endTime.getUTCHours().toString().padStart(2, '0')}:${booking.endTime.getUTCMinutes().toString().padStart(2, '0')}`,
          bookedBy: booking.user.name
        }))
      }
    });

  } catch (error) {
    console.error('❌ Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
});

// Get existing bookings for a court on a specific date
router.get('/court/:courtId/bookings', [
  param('courtId').isInt({ min: 1 }).withMessage('Valid court ID required'),
  query('date').isISO8601().withMessage('Valid date required')
], async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        courtId: parseInt(courtId),
        bookingDate: {
          gte: targetDate,
          lt: nextDay
        },
        status: {
          in: ['confirmed', 'pending']
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      startTime: `${booking.startTime.getUTCHours().toString().padStart(2, '0')}:${booking.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
      endTime: `${booking.endTime.getUTCHours().toString().padStart(2, '0')}:${booking.endTime.getUTCMinutes().toString().padStart(2, '0')}`,
      duration: `${((booking.endTime - booking.startTime) / (1000 * 60 * 60))} hours`,
      totalAmount: booking.totalAmount,
      status: booking.status,
      bookedBy: booking.user.name
    }));

    res.json({
      success: true,
      data: formattedBookings
    });

  } catch (error) {
    console.error('❌ Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message
    });
  }
});

export default router;
