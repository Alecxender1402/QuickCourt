import prisma from '../config/prisma.js';

export class TimeSlotService {
  // Generate time slots for a venue based on working hours
  static async generateTimeSlotsForVenue(venueId, days = 30) {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        include: {
          workingHours: true,
          courts: {
            where: { isActive: true }
          }
        }
      });

      if (!venue) {
        throw new Error('Venue not found');
      }

      const slots = [];
      const startDate = new Date();
      
      for (let day = 0; day < days; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Find working hours for this day
        const workingHour = venue.workingHours.find(wh => wh.dayOfWeek === dayOfWeek && wh.isActive);
        
        if (!workingHour) continue; // Skip if venue is closed this day

        // Extract time from DateTime objects
        const startTime = workingHour.startTime.toTimeString().slice(0, 8);
        const endTime = workingHour.endTime.toTimeString().slice(0, 8);

        // Generate slots for each court
        for (const court of venue.courts) {
          const timeSlots = this.generateDailyTimeSlots(
            startTime,
            endTime,
            court.pricePerHour,
            60 // 60-minute slots
          );

          for (const slot of timeSlots) {
            // Format time properly for the actual booking date
            const startTimeFormatted = `${currentDate.toISOString().split('T')[0]}T${slot.startTime}`;
            const endTimeFormatted = `${currentDate.toISOString().split('T')[0]}T${slot.endTime}`;
            
            slots.push({
              courtId: court.id,
              date: currentDate,
              startTime: new Date(startTimeFormatted),
              endTime: new Date(endTimeFormatted),
              pricePerSlot: slot.price,
              isAvailable: true,
              isBlocked: false
            });
          }
        }
      }

      // Bulk create time slots (avoiding duplicates)
      if (slots.length > 0) {
        await prisma.courtTimeSlot.createMany({
          data: slots,
          skipDuplicates: true
        });
      }

      return slots.length;
    } catch (error) {
      console.error('Error generating time slots:', error);
      throw error;
    }
  }

  // Helper method to generate time slots for a day
  static generateDailyTimeSlots(startTime, endTime, pricePerHour, slotDuration = 60) {
    const slots = [];
    // Use current date as base instead of 1970
    const today = new Date().toISOString().split('T')[0];
    const start = new Date(`${today}T${startTime}`);
    const end = new Date(`${today}T${endTime}`);
    
    let current = new Date(start);
    
    while (current < end) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);
      
      if (slotEnd <= end) {
        slots.push({
          startTime: current.toTimeString().slice(0, 8),
          endTime: slotEnd.toTimeString().slice(0, 8),
          price: pricePerHour
        });
      }
      
      current = slotEnd;
    }
    
    return slots;
  }

  // Get available time slots for a court on a specific date
  static async getAvailableTimeSlots(courtId, date) {
    try {
      const timeSlots = await prisma.courtTimeSlot.findMany({
        where: {
          courtId: courtId,
          date: new Date(date),
          isAvailable: true,
          isBlocked: false,
          bookingTimeSlot: null // Not booked
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      return timeSlots;
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw error;
    }
  }

  // Book time slots
  static async bookTimeSlots(bookingId, timeSlotIds) {
    try {
      // Verify all time slots are available
      const timeSlots = await prisma.courtTimeSlot.findMany({
        where: {
          id: { in: timeSlotIds },
          isAvailable: true,
          isBlocked: false,
          bookingTimeSlot: null
        }
      });

      if (timeSlots.length !== timeSlotIds.length) {
        throw new Error('Some time slots are not available');
      }

      // Create booking time slot relations
      const bookingTimeSlots = timeSlotIds.map(timeSlotId => ({
        bookingId: bookingId,
        courtTimeSlotId: timeSlotId
      }));

      await prisma.bookingTimeSlot.createMany({
        data: bookingTimeSlots
      });

      // Mark time slots as unavailable
      await prisma.courtTimeSlot.updateMany({
        where: {
          id: { in: timeSlotIds }
        },
        data: {
          isAvailable: false
        }
      });

      return timeSlots;
    } catch (error) {
      console.error('Error booking time slots:', error);
      throw error;
    }
  }

  // Cancel booking and release time slots
  static async cancelBookingTimeSlots(bookingId) {
    try {
      // Get booking time slots
      const bookingTimeSlots = await prisma.bookingTimeSlot.findMany({
        where: { bookingId: bookingId },
        select: { courtTimeSlotId: true }
      });

      const timeSlotIds = bookingTimeSlots.map(bts => bts.courtTimeSlotId);

      // Delete booking time slot relations
      await prisma.bookingTimeSlot.deleteMany({
        where: { bookingId: bookingId }
      });

      // Mark time slots as available again
      await prisma.courtTimeSlot.updateMany({
        where: {
          id: { in: timeSlotIds }
        },
        data: {
          isAvailable: true
        }
      });

      return timeSlotIds.length;
    } catch (error) {
      console.error('Error canceling booking time slots:', error);
      throw error;
    }
  }

  // Block/unblock time slots (for facility providers)
  static async toggleTimeSlotBlock(timeSlotIds, isBlocked) {
    try {
      await prisma.courtTimeSlot.updateMany({
        where: {
          id: { in: timeSlotIds }
        },
        data: {
          isBlocked: isBlocked,
          isAvailable: !isBlocked
        }
      });

      return timeSlotIds.length;
    } catch (error) {
      console.error('Error toggling time slot block:', error);
      throw error;
    }
  }

  // Set venue working hours
  static async setVenueWorkingHours(venueId, workingHours) {
    try {
      // Delete existing working hours
      await prisma.venueWorkingHours.deleteMany({
        where: { venueId: venueId }
      });

      // Create new working hours
      const data = workingHours.map(wh => ({
        venueId: venueId,
        dayOfWeek: wh.dayOfWeek,
        startTime: new Date(`1970-01-01T${wh.startTime}`),
        endTime: new Date(`1970-01-01T${wh.endTime}`),
        isActive: wh.isActive || true
      }));

      await prisma.venueWorkingHours.createMany({
        data: data
      });

      return data.length;
    } catch (error) {
      console.error('Error setting venue working hours:', error);
      throw error;
    }
  }

  // Get venue working hours
  static async getVenueWorkingHours(venueId) {
    try {
      const workingHours = await prisma.venueWorkingHours.findMany({
        where: { venueId: venueId },
        orderBy: { dayOfWeek: 'asc' }
      });

      return workingHours;
    } catch (error) {
      console.error('Error fetching venue working hours:', error);
      throw error;
    }
  }
}
