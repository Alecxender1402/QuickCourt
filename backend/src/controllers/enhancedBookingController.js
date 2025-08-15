import { validationResult } from 'express-validator';
import { TimeSlotService } from '../services/timeSlotService.js';
import prisma from '../config/prisma.js';

// Enhanced booking controller with time slot management
export const createBookingWithTimeSlots = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { courtId, date, timeSlotIds, notes } = req.body;
    const userId = req.user.id;

    // First verify that the court exists and is active
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId),
        isActive: true,
      },
      include: {
        venue: {
          select: {
            isApproved: true,
          },
        },
      },
    });

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found or is currently unavailable',
      });
    }

    if (!court.venue.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Venue is not available',
      });
    }

    // Verify time slots are available
    const availableSlots = await prisma.courtTimeSlot.findMany({
      where: {
        id: { in: timeSlotIds },
        courtId: parseInt(courtId),
        date: new Date(date),
        isAvailable: true,
        isBlocked: false,
        bookingTimeSlot: null
      },
      include: {
        court: {
          include: {
            venue: true
          }
        }
      }
    });

    if (availableSlots.length !== timeSlotIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some time slots are not available',
      });
    }

    // Calculate total amount
    const totalAmount = availableSlots.reduce((sum, slot) => {
      return sum + parseFloat(slot.pricePerSlot);
    }, 0);

    // Get start and end times
    const startTimes = availableSlots.map(slot => slot.startTime).sort();
    const endTimes = availableSlots.map(slot => slot.endTime).sort();
    const startTime = startTimes[0];
    const endTime = endTimes[endTimes.length - 1];

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        courtId: parseInt(courtId),
        venueId: availableSlots[0].court.venueId,
        bookingDate: new Date(date),
        startTime: startTime,
        endTime: endTime,
        totalAmount: totalAmount,
        status: 'confirmed',
        paymentStatus: 'pending',
        notes: notes || null,
        confirmedAt: new Date()
      }
    });

    // Book the time slots
    await TimeSlotService.bookTimeSlots(booking.id, timeSlotIds);

    // Return booking with time slot details
    const bookingWithDetails = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        court: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                address: true,
                location: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        bookingTimeSlots: {
          include: {
            courtTimeSlot: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: bookingWithDetails,
    });

  } catch (error) {
    console.error('Create booking with time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

// Cancel booking and release time slots
export const cancelBookingWithTimeSlots = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user.id;

    // Verify booking belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        userId: userId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to cancel it',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    // Release time slots
    await TimeSlotService.cancelBookingTimeSlots(booking.id);

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        cancellationReason: cancellationReason || 'Cancelled by user',
        cancelledAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });

  } catch (error) {
    console.error('Cancel booking with time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

// Get user bookings with time slot details
export const getUserBookingsWithTimeSlots = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, offset = 0 } = req.query;

    let whereClause = { userId: userId };
    if (status) {
      whereClause.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        court: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                address: true,
                location: true,
                photos: true
              }
            }
          }
        },
        bookingTimeSlots: {
          include: {
            courtTimeSlot: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.booking.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Get user bookings with time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};
