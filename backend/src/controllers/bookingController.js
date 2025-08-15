import Booking from '../models/Booking.js';
import prisma from '../config/prisma.js';

// Get bookings for venue owner's venues
export const getBookings = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const {
      status,
      venueId,
      courtId,
      date,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    // Build where conditions
    const whereConditions = {
      venue: {
        ownerId: ownerId,
      },
    };

    if (status) {
      whereConditions.status = status;
    }

    if (venueId) {
      whereConditions.venueId = parseInt(venueId);
    }

    if (courtId) {
      whereConditions.courtId = parseInt(courtId);
    }

    if (date) {
      whereConditions.bookingDate = new Date(date);
    } else if (startDate && endDate) {
      whereConditions.bookingDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereConditions,
      include: {
        court: {
          select: {
            name: true,
            sportType: true,
          },
        },
        venue: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ bookingDate: 'desc' }, { startTime: 'desc' }],
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Transform to match expected format
    const transformedBookings = bookings.map((booking) => ({
      ...booking,
      court_name: booking.court.name,
      sport_type: booking.court.sportType,
      venue_name: booking.venue.name,
      user_name: booking.user.name,
      user_email: booking.user.email,
      user_id: booking.user.id,
    }));

    res.json({
      success: true,
      data: transformedBookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

// Update booking status (approve/reject)
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, reason } = req.body;

    if (!['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be confirmed or cancelled',
      });
    }

    // Find booking with ownership verification
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        venue: {
          ownerId: req.user.id,
        },
      },
      include: {
        court: true,
        venue: true,
        user: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied',
      });
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status,
        cancellationReason: status === 'cancelled' ? reason : null,
        confirmedAt: status === 'confirmed' ? new Date() : null,
        cancelledAt: status === 'cancelled' ? new Date() : null,
      },
      include: {
        court: true,
        venue: true,
        user: true,
      },
    });

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: updatedBooking,
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message,
    });
  }
};
