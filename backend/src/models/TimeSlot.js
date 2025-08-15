import prisma from '../config/prisma.js';

class TimeSlot {
  constructor(timeSlotData) {
    this.id = timeSlotData.id;
    this.venueId = timeSlotData.venueId;
    this.courtId = timeSlotData.courtId;
    this.dayOfWeek = timeSlotData.dayOfWeek; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    this.startTime = timeSlotData.startTime;
    this.endTime = timeSlotData.endTime;
    this.isAvailable = timeSlotData.isAvailable;
    this.createdAt = timeSlotData.createdAt;

    // Related data
    this.venueName = timeSlotData.venue?.name;
    this.courtName = timeSlotData.court?.name;
    this.sportType = timeSlotData.court?.sportType;
    this.pricePerHour = timeSlotData.court?.pricePerHour;
  }

  // Create a new time slot
  static async create(timeSlotData) {
    const { venueId, courtId, dayOfWeek, startTime, endTime, isAvailable = true } = timeSlotData;

    // Convert time strings to Date objects for storage
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);

    const timeSlot = await prisma.timeSlot.create({
      data: {
        dayOfWeek,
        startTime: start,
        endTime: end,
        isAvailable,
        venue: {
          connect: { id: venueId }
        },
        court: {
          connect: { id: courtId }
        },
      },
      include: {
        venue: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
            pricePerHour: true,
          },
        },
      },
    });

    return new TimeSlot(timeSlot);
  }

  // Create multiple time slots for a court
  static async createMultiple(timeSlots) {
    const data = timeSlots.map((slot) => ({
      venueId: slot.venueId,
      courtId: slot.courtId,
      dayOfWeek: slot.dayOfWeek,
      startTime: new Date(`1970-01-01T${slot.startTime}`),
      endTime: new Date(`1970-01-01T${slot.endTime}`),
      isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true,
    }));

    const createdSlots = await prisma.timeSlot.createMany({
      data,
      skipDuplicates: true,
    });

    return createdSlots;
  }

  // Find time slot by ID
  static async findById(id) {
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: parseInt(id) },
      include: {
        venue: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
            pricePerHour: true,
          },
        },
      },
    });

    return timeSlot ? new TimeSlot(timeSlot) : null;
  }

  // Get time slots by venue
  static async findByVenue(venueId, dayOfWeek = null, courtId = null) {
    const where = {
      venueId: parseInt(venueId),
      isAvailable: true,
    };

    if (dayOfWeek !== null) {
      where.dayOfWeek = dayOfWeek;
    }

    if (courtId) {
      where.courtId = parseInt(courtId);
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where,
      include: {
        court: {
          select: {
            name: true,
            sportType: true,
            pricePerHour: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return timeSlots.map((slot) => new TimeSlot(slot));
  }

  // Get time slots by court
  static async findByCourt(courtId, dayOfWeek = null) {
    const where = {
      courtId: parseInt(courtId),
      isAvailable: true,
    };

    if (dayOfWeek !== null) {
      where.dayOfWeek = dayOfWeek;
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where,
      include: {
        venue: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
            pricePerHour: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return timeSlots.map((slot) => new TimeSlot(slot));
  }

  // Get available time slots for a specific date
  static async getAvailableSlots(courtId, date) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // First get the court to ensure we're working with the correct venue
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId),
        isActive: true,
      },
      include: {
        venue: {
          select: {
            id: true,
            isApproved: true,
          },
        },
      },
    });

    if (!court || !court.venue.isApproved) {
      return [];
    }

    // Get all time slots for this specific court, venue, and day
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: parseInt(courtId),
        venueId: court.venue.id, // Filter by specific venue
        dayOfWeek,
        isAvailable: true,
      },
      include: {
        court: {
          select: {
            name: true,
            sportType: true,
            pricePerHour: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get existing bookings for this date, court, and venue
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId: parseInt(courtId),
        venueId: court.venue.id, // Filter by specific venue
        bookingDate: targetDate,
        status: {
          not: 'cancelled',
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Filter out time slots that conflict with existing bookings
    const availableSlots = timeSlots.filter((slot) => {
      return !existingBookings.some((booking) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        // Check for time overlap - use proper overlap detection
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });
    });

    return availableSlots.map((slot) => new TimeSlot(slot));
  }

  // Update time slot
  async update(updateData) {
    const allowedFields = ['dayOfWeek', 'startTime', 'endTime', 'isAvailable'];
    const prismaUpdateData = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'startTime' || key === 'endTime') {
          // Convert time string to Date object
          prismaUpdateData[key] = new Date(`1970-01-01T${updateData[key]}`);
        } else {
          prismaUpdateData[key] = updateData[key];
        }
      }
    });

    if (Object.keys(prismaUpdateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id: this.id },
      data: prismaUpdateData,
      include: {
        venue: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
            pricePerHour: true,
          },
        },
      },
    });

    return new TimeSlot(updatedTimeSlot);
  }

  // Delete time slot
  async delete() {
    await prisma.timeSlot.delete({
      where: { id: this.id },
    });

    return true;
  }

  // Bulk delete time slots
  static async deleteByCourt(courtId) {
    const result = await prisma.timeSlot.deleteMany({
      where: { courtId: parseInt(courtId) },
    });

    return result.count;
  }

  // Bulk delete time slots by venue
  static async deleteByVenue(venueId) {
    const result = await prisma.timeSlot.deleteMany({
      where: { venueId: parseInt(venueId) },
    });

    return result.count;
  }

  // Toggle availability
  async toggleAvailability() {
    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id: this.id },
      data: { isAvailable: !this.isAvailable },
    });

    return new TimeSlot(updatedTimeSlot);
  }

  // Get day name from day of week number
  getDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[this.dayOfWeek];
  }

  // Format time for display
  getFormattedStartTime() {
    return this.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getFormattedEndTime() {
    return this.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Calculate duration in hours
  getDurationInHours() {
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    const diffMs = end - start;
    return diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
  }

  // Calculate price for this time slot
  getPrice() {
    if (!this.pricePerHour) return 0;
    return parseFloat(this.pricePerHour) * this.getDurationInHours();
  }

  // Check if time slot is in the past for a given date
  isPast(date) {
    const now = new Date();
    const slotDateTime = new Date(date);
    const slotTime = new Date(this.startTime);

    slotDateTime.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);

    return slotDateTime < now;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      venueId: this.venueId,
      courtId: this.courtId,
      dayOfWeek: this.dayOfWeek,
      dayName: this.getDayName(),
      startTime: this.startTime,
      endTime: this.endTime,
      formattedStartTime: this.getFormattedStartTime(),
      formattedEndTime: this.getFormattedEndTime(),
      duration: this.getDurationInHours(),
      price: this.getPrice(),
      isAvailable: this.isAvailable,
      createdAt: this.createdAt,
      venueName: this.venueName,
      courtName: this.courtName,
      sportType: this.sportType,
      pricePerHour: this.pricePerHour ? parseFloat(this.pricePerHour) : null,
    };
  }
}

export default TimeSlot;
