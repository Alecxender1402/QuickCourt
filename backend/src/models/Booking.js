import prisma from '../config/prisma.js';

class Booking {
  constructor(bookingData) {
    this.id = bookingData.id;
    this.userId = bookingData.userId;
    this.courtId = bookingData.courtId;
    this.venueId = bookingData.venueId;
    this.bookingDate = bookingData.bookingDate;
    this.startTime = bookingData.startTime;
    this.endTime = bookingData.endTime;
    this.totalAmount = bookingData.totalAmount;
    this.status = bookingData.status;
    this.paymentStatus = bookingData.paymentStatus;
    this.paymentId = bookingData.paymentId;
    this.notes = bookingData.notes;
    this.reviewed = bookingData.reviewed;
    this.confirmedAt = bookingData.confirmedAt;
    this.rescheduledAt = bookingData.rescheduledAt;
    this.cancellationReason = bookingData.cancellationReason;
    this.cancelledAt = bookingData.cancelledAt;
    this.createdAt = bookingData.createdAt;
    this.updatedAt = bookingData.updatedAt;

    // Related data
    this.userName = bookingData.user?.name;
    this.userEmail = bookingData.user?.email;
    this.courtName = bookingData.court?.name;
    this.sportType = bookingData.court?.sportType;
    this.venueName = bookingData.venue?.name;
    this.venueLocation = bookingData.venue?.location;
  }

  // Create a new booking
  static async create(bookingData) {
    const { userId, courtId, venueId, bookingDate, startTime, endTime, totalAmount, notes } =
      bookingData;

    try {
      // Parse time strings correctly without timezone conversion
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const baseDate = new Date('1970-01-01T00:00:00.000Z');
      const startTimeDate = new Date(baseDate);
      startTimeDate.setUTCHours(startHour, startMinute, 0, 0);
      
      const endTimeDate = new Date(baseDate);
      endTimeDate.setUTCHours(endHour, endMinute, 0, 0);

      const booking = await prisma.booking.create({
        data: {
          userId,
          courtId,
          venueId,
          bookingDate: new Date(bookingDate),
          startTime: startTimeDate,
          endTime: endTimeDate,
          totalAmount,
          notes,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          court: {
            select: {
              name: true,
              sportType: true,
            },
          },
          venue: {
            select: {
              name: true,
              location: true,
            },
          },
        },
      });

      return new Booking(booking);
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        throw new Error('This time slot is already booked');
      }
      throw error;
    }
  }

  // Find booking by ID
  static async findById(id) {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
          },
        },
        venue: {
          select: {
            name: true,
            location: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
    });

    return booking ? new Booking(booking) : null;
  }

  // Get bookings by user
  static async findByUser(userId, status = null, limit = 20, offset = 0) {
    const where = {
      userId: parseInt(userId),
    };

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
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
            location: true,
          },
        },
      },
      orderBy: [{ bookingDate: 'desc' }, { startTime: 'desc' }],
      take: limit,
      skip: offset,
    });

    return bookings.map((booking) => new Booking(booking));
  }

  // Get bookings by venue (for facility owners)
  static async findByVenue(venueId, status = null, date = null, limit = 20, offset = 0) {
    const where = {
      venueId: parseInt(venueId),
    };

    if (status) {
      where.status = status;
    }

    if (date) {
      where.bookingDate = new Date(date);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
          },
        },
      },
      orderBy: [{ bookingDate: 'desc' }, { startTime: 'desc' }],
      take: limit,
      skip: offset,
    });

    return bookings.map((booking) => new Booking(booking));
  }

  // Get upcoming bookings
  static async findUpcoming(userId, limit = 10) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const bookings = await prisma.booking.findMany({
      where: {
        userId: parseInt(userId),
        status: 'confirmed',
        OR: [
          {
            bookingDate: {
              gt: today,
            },
          },
          {
            AND: [
              {
                bookingDate: today,
              },
              {
                startTime: {
                  gt: now,
                },
              },
            ],
          },
        ],
      },
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
            location: true,
          },
        },
      },
      orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
      take: limit,
    });

    return bookings.map((booking) => new Booking(booking));
  }

  // Get booking statistics for venue owner
  static async getVenueStats(venueId, startDate = null, endDate = null) {
    const where = {
      venueId: parseInt(venueId),
    };

    if (startDate && endDate) {
      where.bookingDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [bookingStats, earnings, courtCount] = await Promise.all([
      prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
      }),
      prisma.booking.aggregate({
        where: {
          ...where,
          status: {
            in: ['confirmed', 'completed'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.court.count({
        where: {
          venueId: parseInt(venueId),
          isActive: true,
        },
      }),
    ]);

    const stats = {
      totalBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalEarnings: parseFloat(earnings._sum.totalAmount) || 0,
      activeCourts: courtCount,
    };

    bookingStats.forEach((stat) => {
      stats.totalBookings += stat._count.id;
      switch (stat.status) {
        case 'confirmed':
          stats.confirmedBookings = stat._count.id;
          break;
        case 'completed':
          stats.completedBookings = stat._count.id;
          break;
        case 'cancelled':
          stats.cancelledBookings = stat._count.id;
          break;
      }
    });

    return stats;
  }

  // Update booking status
  async updateStatus(newStatus) {
    const updatedBooking = await prisma.booking.update({
      where: { id: this.id },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
          },
        },
        venue: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    return new Booking(updatedBooking);
  }

  // Update payment status
  async updatePaymentStatus(paymentStatus, paymentId = null) {
    const updatedBooking = await prisma.booking.update({
      where: { id: this.id },
      data: {
        paymentStatus,
        paymentId: paymentId || this.paymentId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
          },
        },
        venue: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    return new Booking(updatedBooking);
  }

  // Cancel booking (only if in future)
  async cancel(reason = null) {
    const now = new Date();
    const bookingDateTime = new Date(`${this.bookingDate} ${this.startTime}`);

    if (bookingDateTime <= now) {
      throw new Error('Cannot cancel past bookings');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: this.id },
      data: {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });

    return new Booking(updatedBooking);
  }

  // Mark as completed
  async complete() {
    return this.updateStatus('completed');
  }

  // Reschedule booking
  async reschedule(newDate, newStartTime, newEndTime) {
    // Parse time strings correctly without timezone conversion
    const [startHour, startMinute] = newStartTime.split(':').map(Number);
    const [endHour, endMinute] = newEndTime.split(':').map(Number);
    
    const baseDate = new Date('1970-01-01T00:00:00.000Z');
    const startTimeDate = new Date(baseDate);
    startTimeDate.setUTCHours(startHour, startMinute, 0, 0);
    
    const endTimeDate = new Date(baseDate);
    endTimeDate.setUTCHours(endHour, endMinute, 0, 0);

    const updatedBooking = await prisma.booking.update({
      where: { id: this.id },
      data: {
        bookingDate: new Date(newDate),
        startTime: startTimeDate,
        endTime: endTimeDate,
        rescheduledAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
          },
        },
        venue: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    return new Booking(updatedBooking);
  }

  // Mark as reviewed
  async markAsReviewed() {
    const updatedBooking = await prisma.booking.update({
      where: { id: this.id },
      data: { reviewed: true },
    });

    return new Booking(updatedBooking);
  }

  // Check if booking can be cancelled
  canBeCancelled() {
    const now = new Date();
    const bookingDateTime = new Date(`${this.bookingDate} ${this.startTime}`);

    return bookingDateTime > now && this.status === 'confirmed';
  }

  // Check if booking can be reviewed
  canBeReviewed() {
    const now = new Date();
    const bookingDateTime = new Date(`${this.bookingDate} ${this.endTime}`);

    return bookingDateTime <= now && this.status === 'completed' && !this.reviewed;
  }

  // Get booking conflicts
  static async findConflicts(courtId, bookingDate, startTime, endTime, excludeBookingId = null) {
    const where = {
      courtId: parseInt(courtId),
      bookingDate: new Date(bookingDate),
      status: {
        not: 'cancelled',
      },
      OR: [
        {
          AND: [
            { startTime: { lte: new Date(`1970-01-01T${startTime}`) } },
            { endTime: { gt: new Date(`1970-01-01T${startTime}`) } },
          ],
        },
        {
          AND: [
            { startTime: { lt: new Date(`1970-01-01T${endTime}`) } },
            { endTime: { gte: new Date(`1970-01-01T${endTime}`) } },
          ],
        },
        {
          AND: [
            { startTime: { gte: new Date(`1970-01-01T${startTime}`) } },
            { endTime: { lte: new Date(`1970-01-01T${endTime}`) } },
          ],
        },
      ],
    };

    if (excludeBookingId) {
      where.id = { not: parseInt(excludeBookingId) };
    }

    return await prisma.booking.findMany({ where });
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      courtId: this.courtId,
      venueId: this.venueId,
      bookingDate: this.bookingDate,
      startTime: this.startTime,
      endTime: this.endTime,
      totalAmount: parseFloat(this.totalAmount),
      status: this.status,
      paymentStatus: this.paymentStatus,
      paymentId: this.paymentId,
      notes: this.notes,
      reviewed: this.reviewed,
      confirmedAt: this.confirmedAt,
      rescheduledAt: this.rescheduledAt,
      cancellationReason: this.cancellationReason,
      cancelledAt: this.cancelledAt,
      canCancel: this.canBeCancelled(),
      canReview: this.canBeReviewed(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      userName: this.userName,
      userEmail: this.userEmail,
      courtName: this.courtName,
      sportType: this.sportType,
      venueName: this.venueName,
      venueLocation: this.venueLocation,
    };
  }
}

export default Booking;
