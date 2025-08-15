import { validationResult } from 'express-validator';
import { TimeSlotService } from '../services/timeSlotService.js';
import prisma from '../config/prisma.js';

// Get available time slots for a court on a specific date
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    const timeSlots = await TimeSlotService.getAvailableTimeSlots(
      parseInt(courtId),
      date
    );

    res.json({
      success: true,
      data: timeSlots,
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available time slots',
      error: error.message,
    });
  }
};

// Get available time slots for all courts in a venue
export const getVenueAvailableTimeSlots = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { venueId } = req.params;
    const { date, sportType } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    // Get courts for the venue
    let courtFilter = {
      venueId: parseInt(venueId),
      isActive: true
    };

    if (sportType) {
      courtFilter.sportType = sportType;
    }

    const courts = await prisma.court.findMany({
      where: courtFilter,
      select: {
        id: true,
        name: true,
        sportType: true,
        pricePerHour: true
      }
    });

    // Get available time slots for each court
    const courtSlots = await Promise.all(
      courts.map(async (court) => {
        const timeSlots = await TimeSlotService.getAvailableTimeSlots(
          court.id,
          date
        );
        return {
          court,
          timeSlots
        };
      })
    );

    res.json({
      success: true,
      data: courtSlots,
    });
  } catch (error) {
    console.error('Get venue available time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venue available time slots',
      error: error.message,
    });
  }
};

// Set venue working hours (for facility providers)
export const setVenueWorkingHours = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { venueId } = req.params;
    const { workingHours } = req.body;

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

    const updatedCount = await TimeSlotService.setVenueWorkingHours(
      parseInt(venueId),
      workingHours
    );

    res.json({
      success: true,
      message: 'Venue working hours updated successfully',
      data: { updatedCount },
    });
  } catch (error) {
    console.error('Set venue working hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update venue working hours',
      error: error.message,
    });
  }
};

// Get venue working hours
export const getVenueWorkingHours = async (req, res) => {
  try {
    const { venueId } = req.params;

    const workingHours = await TimeSlotService.getVenueWorkingHours(
      parseInt(venueId)
    );

    res.json({
      success: true,
      data: workingHours,
    });
  } catch (error) {
    console.error('Get venue working hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venue working hours',
      error: error.message,
    });
  }
};

// Generate time slots for a venue (for facility providers)
export const generateVenueTimeSlots = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { 
      days = 30, 
      courtId, 
      daysOfWeek = [1, 2, 3, 4, 5, 6, 7], // Default all days
      startTime = '09:00:00',
      endTime = '21:00:00',
      slotDuration = 60
    } = req.body;

    console.log('🎯 Generate venue time slots request:', {
      venueId,
      courtId,
      days,
      daysOfWeek,
      startTime,
      endTime,
      slotDuration,
      userId: req.user?.id
    });

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

    let generatedSlots = [];

    if (courtId) {
      // Generate for specific court
      const court = await prisma.court.findFirst({
        where: {
          id: parseInt(courtId),
          venueId: parseInt(venueId)
        }
      });

      if (!court) {
        return res.status(404).json({
          success: false,
          message: 'Court not found',
        });
      }

      // Generate time slots for the specified number of days
      const startDate = new Date();
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayOfWeek = currentDate.getDay() + 1; // Convert to 1-7 format
        
        if (daysOfWeek.includes(dayOfWeek)) {
          const dailySlots = await generateDailySlots(
            parseInt(venueId),
            parseInt(courtId),
            currentDate,
            startTime,
            endTime,
            slotDuration
          );
          generatedSlots.push(...dailySlots);
        }
      }
    } else {
      // Generate for all courts in venue
      const generatedCount = await TimeSlotService.generateTimeSlotsForVenue(
        parseInt(venueId),
        days
      );
      
      return res.json({
        success: true,
        message: 'Time slots generated successfully for all courts',
        data: { generatedCount },
      });
    }

    res.json({
      success: true,
      message: 'Time slots generated successfully',
      data: generatedSlots,
    });
  } catch (error) {
    console.error('Generate venue time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate venue time slots',
      error: error.message,
    });
  }
};

// Helper function to generate daily slots for legacy time_slots table
async function generateDailySlots(venueId, courtId, date, startTime, endTime, slotDurationMinutes) {
  const slots = [];
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  // Get day of week (0 = Sunday, 6 = Saturday, but we store 1-7)
  const dayOfWeek = date.getDay() + 1; // Convert to 1-7 format
  
  let currentTime = new Date(`2000-01-01 ${startTime}:00`);
  const endDateTime = new Date(`2000-01-01 ${endTime}:00`);
  
  while (currentTime < endDateTime) {
    const slotEndTime = new Date(currentTime);
    slotEndTime.setMinutes(currentTime.getMinutes() + slotDurationMinutes);
    
    if (slotEndTime <= endDateTime) {
      try {
        // Check if slot already exists
        const existingSlot = await prisma.timeSlot.findFirst({
          where: {
            venueId: venueId,
            courtId: courtId,
            dayOfWeek: dayOfWeek,
            startTime: currentTime,
            endTime: slotEndTime
          }
        });

        if (!existingSlot) {
          const newSlot = await prisma.timeSlot.create({
            data: {
              venueId: venueId,
              courtId: courtId,
              dayOfWeek: dayOfWeek,
              startTime: currentTime,
              endTime: slotEndTime,
              isAvailable: true
            }
          });
          slots.push(newSlot);
        }
      } catch (error) {
        console.error('Error creating slot:', error);
      }
    }
    
    currentTime.setMinutes(currentTime.getMinutes() + slotDurationMinutes);
  }
  
  return slots;
}

// Generate default time slots for a specific court
export const generateCourtTimeSlots = async (req, res) => {
  try {
    const { venueId, courtId } = req.params;
    const { days = 30, operatingHours, slotDuration = 60, daysOfWeek } = req.body;

    console.log('🎯 Generate court time slots request:', {
      venueId,
      courtId,
      days,
      operatingHours,
      slotDuration,
      daysOfWeek,
      userId: req.user?.id
    });

    // Verify user owns the venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        ownerId: req.user.id
      }
    });

    if (!venue) {
      console.log('❌ Venue not found or no permission:', { venueId, ownerId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Venue not found or you do not have permission to manage it',
      });
    }

    // Verify court exists and belongs to the venue
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId),
        venueId: parseInt(venueId)
      }
    });

    if (!court) {
      console.log('❌ Court not found:', { courtId, venueId });
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    console.log('✅ Venue and court validation passed');

    // If operating hours are provided, set venue working hours first
    if (operatingHours && operatingHours.start && operatingHours.end) {
      const workingHours = [];
      const selectedDays = daysOfWeek || [0, 1, 2, 3, 4, 5, 6]; // Default to all days
      
      console.log('⏰ Setting working hours:', { operatingHours, selectedDays });
      
      selectedDays.forEach(dayOfWeek => {
        workingHours.push({
          dayOfWeek,
          startTime: operatingHours.start,
          endTime: operatingHours.end,
          isActive: true
        });
      });

      await TimeSlotService.setVenueWorkingHours(parseInt(venueId), workingHours);
      console.log('✅ Working hours set successfully');
    }

    // Generate time slots for the venue (which includes this court)
    console.log('🔄 Generating time slots for venue...');
    const generatedCount = await TimeSlotService.generateTimeSlotsForVenue(
      parseInt(venueId),
      days
    );

    console.log('✅ Time slots generated:', { generatedCount });

    res.json({
      success: true,
      message: 'Time slots generated successfully for court',
      data: { generatedCount },
    });
  } catch (error) {
    console.error('❌ Generate court time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate court time slots',
      error: error.message,
    });
  }
};

// Create time slots for a specific court
export const createCourtTimeSlots = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { venueId, courtId } = req.params;
    const { timeSlots } = req.body;

    console.log('🎯 Create court time slots request:', {
      venueId,
      courtId,
      timeSlots,
      userId: req.user?.id
    });

    // Verify user owns the venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        ownerId: req.user.id
      }
    });

    if (!venue) {
      console.log('❌ Venue not found or no permission:', { venueId, ownerId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Venue not found or you do not have permission to manage it',
      });
    }

    // Verify court exists and belongs to the venue
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId),
        venueId: parseInt(venueId),
        isActive: true
      }
    });

    if (!court) {
      console.log('❌ Court not found:', { courtId, venueId });
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    console.log('✅ Venue and court validation passed');

    // Validate timeSlots array
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'timeSlots must be a non-empty array',
      });
    }

    // Create time slots using the legacy TimeSlot model
    const createdSlots = [];
    
    for (const slotData of timeSlots) {
      const { dayOfWeek, startTime, endTime, isAvailable = true } = slotData;
      
      // Validate required fields
      if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          message: 'dayOfWeek must be a number between 0 and 6',
        });
      }

      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'startTime and endTime are required',
        });
      }

      // Create time slot
      const timeSlot = await prisma.timeSlot.create({
        data: {
          dayOfWeek: dayOfWeek,
          startTime: new Date(`1970-01-01T${startTime}:00`),
          endTime: new Date(`1970-01-01T${endTime}:00`),
          isAvailable: isAvailable,
          court: {
            connect: { id: parseInt(courtId) }
          },
          venue: {
            connect: { id: parseInt(venueId) }
          }
        }
      });

      createdSlots.push(timeSlot);
    }

    console.log('✅ Time slots created:', { count: createdSlots.length });

    res.json({
      success: true,
      message: 'Time slots created successfully',
      data: createdSlots,
    });
  } catch (error) {
    console.error('❌ Create court time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create court time slots',
      error: error.message,
    });
  }
};

// Update a specific time slot
export const updateCourtTimeSlot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { venueId, courtId, slotId } = req.params;
    const { dayOfWeek, startTime, endTime, isAvailable } = req.body;

    console.log('🎯 Update court time slot request:', {
      venueId,
      courtId,
      slotId,
      updates: req.body,
      userId: req.user?.id
    });

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

    // Verify time slot exists and belongs to the court
    const existingSlot = await prisma.timeSlot.findFirst({
      where: {
        id: parseInt(slotId),
        courtId: parseInt(courtId),
        court: {
          venueId: parseInt(venueId)
        }
      }
    });

    if (!existingSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
    }

    // Build update data
    const updateData = {};
    if (typeof dayOfWeek === 'number') updateData.dayOfWeek = dayOfWeek;
    if (startTime) updateData.startTime = new Date(`1970-01-01T${startTime}:00`);
    if (endTime) updateData.endTime = new Date(`1970-01-01T${endTime}:00`);
    if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable;

    // Update time slot
    const updatedSlot = await prisma.timeSlot.update({
      where: { id: parseInt(slotId) },
      data: updateData
    });

    console.log('✅ Time slot updated:', { slotId });

    res.json({
      success: true,
      message: 'Time slot updated successfully',
      data: updatedSlot,
    });
  } catch (error) {
    console.error('❌ Update court time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court time slot',
      error: error.message,
    });
  }
};

// Delete a specific time slot
export const deleteCourtTimeSlot = async (req, res) => {
  try {
    const { venueId, courtId, slotId } = req.params;

    console.log('🎯 Delete court time slot request:', {
      venueId,
      courtId,
      slotId,
      userId: req.user?.id
    });

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

    // Verify time slot exists and belongs to the court
    const existingSlot = await prisma.timeSlot.findFirst({
      where: {
        id: parseInt(slotId),
        courtId: parseInt(courtId),
        court: {
          venueId: parseInt(venueId)
        }
      }
    });

    if (!existingSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
    }

    // Delete time slot
    await prisma.timeSlot.delete({
      where: { id: parseInt(slotId) }
    });

    console.log('✅ Time slot deleted:', { slotId });

    res.json({
      success: true,
      message: 'Time slot deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete court time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete court time slot',
      error: error.message,
    });
  }
};

// Get court time slots for management (for facility providers)
export const getCourtTimeSlots = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { dayOfWeek, venueId } = req.query;

    console.log('🔍 Get court time slots request:', {
      venueId,
      courtId,
      dayOfWeek,
      userId: req.user?.id
    });

    // Get venue ID from query or find it from court
    let resolvedVenueId = venueId;
    if (!resolvedVenueId) {
      const court = await prisma.court.findUnique({
        where: { id: parseInt(courtId) },
        select: { venueId: true }
      });
      if (court) {
        resolvedVenueId = court.venueId;
      }
    }

    if (!resolvedVenueId) {
      return res.status(400).json({
        success: false,
        message: 'Venue ID required',
      });
    }

    // Verify user owns the venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(resolvedVenueId),
        ownerId: req.user.id
      }
    });

    if (!venue) {
      console.log('❌ Venue not found or no permission:', { venueId: resolvedVenueId, ownerId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Venue not found or you do not have permission to access it',
      });
    }

    // Verify court exists and belongs to the venue
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId),
        venueId: parseInt(resolvedVenueId),
        isActive: true
      }
    });

    if (!court) {
      console.log('❌ Court not found:', { courtId, venueId: resolvedVenueId });
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    // Build filter for time slots
    let whereFilter = {
      courtId: parseInt(courtId),
      venueId: parseInt(resolvedVenueId)
    };

    if (dayOfWeek !== undefined && dayOfWeek !== null) {
      whereFilter.dayOfWeek = parseInt(dayOfWeek);
    }

    // Get legacy time slots (simplified approach)
    const timeSlots = await prisma.timeSlot.findMany({
      where: whereFilter,
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    console.log('✅ Found time slots:', { count: timeSlots.length });

    // Format time slots for frontend
    const formattedSlots = timeSlots.map(slot => ({
      id: slot.id,
      venueId: slot.venueId,
      courtId: slot.courtId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime.toISOString().substring(11, 16), // Convert to "HH:MM" format
      endTime: slot.endTime.toISOString().substring(11, 16),
      isAvailable: slot.isAvailable,
      createdAt: slot.createdAt.toISOString(),
      type: 'legacy'
    }));

    res.json({
      success: true,
      data: formattedSlots,
      message: 'Time slots retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Get court time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get time slots',
      error: error.message,
    });
  }
};
