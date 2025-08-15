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
    const { days = 30 } = req.body;

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

    const generatedCount = await TimeSlotService.generateTimeSlotsForVenue(
      parseInt(venueId),
      days
    );

    res.json({
      success: true,
      message: 'Time slots generated successfully',
      data: { generatedCount },
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

// Get court time slots for management (for facility providers)
export const getCourtTimeSlots = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date, startDate, endDate } = req.query;

    // Verify user owns the venue for this court
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId)
      },
      include: {
        venue: true
      }
    });

    if (!court || court.venue.ownerId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Court not found or you do not have permission to access it',
      });
    }

    let dateFilter = {};
    if (date) {
      dateFilter.date = new Date(date);
    } else if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const timeSlots = await prisma.courtTimeSlot.findMany({
      where: {
        courtId: parseInt(courtId),
        ...dateFilter
      },
      include: {
        bookingTimeSlot: {
          include: {
            booking: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: timeSlots,
    });
  } catch (error) {
    console.error('Get court time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch court time slots',
      error: error.message,
    });
  }
};
