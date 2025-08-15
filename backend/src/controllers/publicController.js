import { validationResult } from 'express-validator';
import prisma from '../config/prisma.js';

// Helper function to enrich venue data with pricing and sports information
const enrichVenueData = async (venues) => {
  console.log('🔍 Enriching venue data for', venues.length, 'venues');

  const enrichedVenues = await Promise.all(
    venues.map(async (venue) => {
      console.log(`📍 Processing venue ID: ${venue.id} - ${venue.name}`);

      // Get courts with pricing information
      const courts = await prisma.court.findMany({
        where: {
          venueId: venue.id,
          isActive: true,
        },
        select: {
          pricePerHour: true,
          sportType: true,
        },
      });

      console.log(`🏟️ Found ${courts.length} courts for venue ${venue.id}`);

      // Calculate min and max prices
      const prices = courts.map((court) => court.pricePerHour);
      const min_price = prices.length > 0 ? Math.min(...prices) : null;
      const max_price = prices.length > 0 ? Math.max(...prices) : null;

      // Get unique sports
      const available_sports = [...new Set(courts.map((court) => court.sportType))];

      // Get courts count
      const courts_count = courts.length;

      console.log(`💰 Pricing for venue ${venue.id}: min=${min_price}, max=${max_price}`);
      console.log(`🏆 Sports for venue ${venue.id}:`, available_sports);

      return {
        ...venue,
        min_price,
        max_price,
        available_sports,
        courts_count,
      };
    })
  );

  return enrichedVenues;
};

// Helper function to get sport description
const getSportDescription = (sportName) => {
  const sport = sportName.toLowerCase();
  switch (sport) {
    case 'badminton':
      return 'Indoor racquet sport with shuttlecock';
    case 'tennis':
      return 'Racquet sport on court';
    case 'football':
      return 'Team sport played with feet';
    case 'cricket':
      return 'Bat and ball sport with wickets';
    case 'swimming':
      return 'Aquatic sport and exercise';
    case 'table tennis':
      return 'Indoor paddle sport';
    case 'basketball':
      return 'Team sport with hoops';
    case 'volleyball':
      return 'Team sport with net';
    default:
      return 'Popular sport activity';
  }
};

// Get all approved venues with search and filters
export const getAllVenues = async (req, res) => {
  try {
    const {
      search,
      city,
      sport,
      priceMin,
      priceMax,
      rating,
      amenities,
      sortBy,
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = req.query;

    let whereClause = {
      isApproved: true,
    };

    // Build search filters
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      whereClause.location = { contains: city, mode: 'insensitive' };
    }

    if (sport) {
      whereClause.courts = {
        some: {
          sportType: sport,
          isActive: true,
        },
      };
    }

    if (priceMin || priceMax) {
      const priceFilter = {};
      if (priceMin) priceFilter.gte = parseFloat(priceMin);
      if (priceMax) priceFilter.lte = parseFloat(priceMax);

      if (whereClause.courts) {
        // If we already have a courts filter, add price to it
        whereClause.courts.some.pricePerHour = priceFilter;
      } else {
        // Create a new courts filter for price
        whereClause.courts = {
          some: {
            pricePerHour: priceFilter,
            isActive: true,
          },
        };
      }
    }

    if (rating) {
      whereClause.rating = { gte: parseFloat(rating) };
    }

    if (amenities) {
      const amenityList = amenities.split(',');
      whereClause.amenities = { hasEvery: amenityList };
    }

    // Build sort order
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price') {
      // For price sorting, we'll use the enriched min_price field
      // This will be applied after enrichment in JavaScript
      orderBy = { createdAt: 'desc' }; // Temporary, will sort by min_price later
    } else if (sortBy === 'rating') {
      orderBy = { rating: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'name') {
      orderBy = { name: sortOrder === 'desc' ? 'desc' : 'asc' };
    } else if (sortBy === 'created_at') {
      orderBy = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
    }

    const venues = await prisma.venue.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        location: true,
        rating: true,
        totalReviews: true,
        contactEmail: true,
        contactPhone: true,
        isApproved: true, // Include approval status to show "Verified" badge
        createdAt: true,
        updatedAt: true,
        courts: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sportType: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: orderBy,
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Get amenities and photos separately to handle the data type issue
    const venueIds = venues.map((v) => v.id);
    const extraData = await prisma.$queryRaw`
      SELECT id, amenities, photos FROM venues WHERE id = ANY(${venueIds})
    `;

    // Map amenities and photos back to venues
    const venuesWithExtras = venues.map((venue) => {
      const extraInfo = extraData.find((a) => Number(a.id) === venue.id);
      let amenities = [];
      let photos = [];

      if (extraInfo) {
        // Handle amenities
        try {
          if (typeof extraInfo.amenities === 'string') {
            amenities = JSON.parse(extraInfo.amenities);
            if (!Array.isArray(amenities)) {
              amenities = [extraInfo.amenities];
            }
          } else if (Array.isArray(extraInfo.amenities)) {
            amenities = extraInfo.amenities;
          }
        } catch (error) {
          console.warn('Failed to parse amenities for venue', venue.id, error);
          amenities = [];
        }

        // Handle photos
        try {
          if (typeof extraInfo.photos === 'string') {
            photos = JSON.parse(extraInfo.photos);
            if (!Array.isArray(photos)) {
              photos = [extraInfo.photos];
            }
          } else if (Array.isArray(extraInfo.photos)) {
            photos = extraInfo.photos;
          }
        } catch (error) {
          console.warn('Failed to parse photos for venue', venue.id, error);
          photos = [];
        }
      }

      return { ...venue, amenities, photos };
    });

    // Enrich venues with pricing and sports data
    const enrichedVenues = await enrichVenueData(venuesWithExtras);

    // Apply price sorting after enrichment (if requested)
    let finalVenues = enrichedVenues;
    if (sortBy === 'price') {
      finalVenues = enrichedVenues.sort((a, b) => {
        const priceA = a.min_price;
        const priceB = b.min_price;

        // Handle null values - venues with prices should always come first
        if (priceA === null && priceB === null) return 0;
        if (priceA === null) return 1; // venues without prices come last
        if (priceB === null) return -1; // venues with prices come first

        // Both have prices, sort by price value
        if (sortOrder === 'asc') {
          return priceA - priceB;
        } else {
          return priceB - priceA;
        }
      });
    }

    const total = await prisma.venue.count({
      where: whereClause,
    });

    // Fallback logic: if no venues found for specific city, show venues from any city
    let fallbackMessage = null;
    let fallbackVenues = finalVenues;
    let fallbackTotal = total;

    if (city && finalVenues.length === 0 && total === 0) {
      console.log(`No venues found for city: ${city}. Searching for venues from any city...`);

      // Create a new query without city filter for fallback
      const fallbackWhereClause = { ...whereClause };
      delete fallbackWhereClause.location; // Remove location filter

      const fallbackVenueResults = await prisma.venue.findMany({
        where: fallbackWhereClause,
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          location: true,
          rating: true,
          totalReviews: true,
          contactEmail: true,
          contactPhone: true,
          isApproved: true,
          createdAt: true,
          updatedAt: true,
          courts: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sportType: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: orderBy,
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      if (fallbackVenueResults.length > 0) {
        // Process fallback venues same way as original venues
        const fallbackVenueIds = fallbackVenueResults.map((v) => v.id);
        const fallbackExtraData = await prisma.$queryRaw`
          SELECT id, amenities, photos FROM venues WHERE id = ANY(${fallbackVenueIds})
        `;

        const fallbackVenuesWithExtras = fallbackVenueResults.map((venue) => {
          const extraInfo = fallbackExtraData.find((a) => a.id === venue.id);
          let amenities = [];
          let photos = [];

          if (extraInfo) {
            try {
              if (typeof extraInfo.amenities === 'string') {
                amenities = JSON.parse(extraInfo.amenities);
                if (!Array.isArray(amenities)) {
                  amenities = [extraInfo.amenities];
                }
              } else if (Array.isArray(extraInfo.amenities)) {
                amenities = extraInfo.amenities;
              }
            } catch (error) {
              console.warn('Failed to parse amenities for fallback venue', venue.id, error);
              amenities = [];
            }

            try {
              if (typeof extraInfo.photos === 'string') {
                photos = JSON.parse(extraInfo.photos);
                if (!Array.isArray(photos)) {
                  photos = [extraInfo.photos];
                }
              } else if (Array.isArray(extraInfo.photos)) {
                photos = extraInfo.photos;
              }
            } catch (error) {
              console.warn('Failed to parse photos for fallback venue', venue.id, error);
              photos = [];
            }
          }

          return { ...venue, amenities, photos };
        });

        const fallbackEnrichedVenues = await enrichVenueData(fallbackVenuesWithExtras);

        // Apply price sorting for fallback venues if requested
        if (sortBy === 'price') {
          fallbackVenues = fallbackEnrichedVenues.sort((a, b) => {
            const priceA = a.min_price;
            const priceB = b.min_price;

            if (priceA === null && priceB === null) return 0;
            if (priceA === null) return 1;
            if (priceB === null) return -1;

            if (sortOrder === 'asc') {
              return priceA - priceB;
            } else {
              return priceB - priceA;
            }
          });
        } else {
          fallbackVenues = fallbackEnrichedVenues;
        }

        fallbackTotal = await prisma.venue.count({
          where: fallbackWhereClause,
        });

        fallbackMessage = `No venues found in ${city}. Showing venues from other cities:`;
        console.log(`Found ${fallbackVenues.length} fallback venues from other cities`);
      }
    }

    res.json({
      success: true,
      data: {
        venues: fallbackVenues,
        pagination: {
          total: fallbackTotal,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: parseInt(offset) + parseInt(limit) < fallbackTotal,
        },
        fallbackMessage, // Include fallback message to inform frontend
        searchedCity: city, // Include searched city for reference
      },
    });
  } catch (error) {
    console.error('Get all venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venues',
      error: error.message,
    });
  }
};

// Search venues (simplified) - alias for backwards compatibility
export const searchVenues = getAllVenues;

// Get venue details (simplified)
export const getVenueDetails = async (req, res) => {
  try {
    const { venueId } = req.params;

    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        isApproved: true,
      },
      include: {
        courts: {
          where: { isActive: true },
          include: {
            timeSlots: true,
          },
        },
        workingHours: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    // Get amenities and photos separately
    const extraData = await prisma.$queryRaw`
      SELECT amenities, photos FROM venues WHERE id = ${venue.id}
    `;

    let amenities = [];
    let photos = [];

    if (extraData.length > 0) {
      const extraInfo = extraData[0];

      // Handle amenities
      try {
        if (typeof extraInfo.amenities === 'string') {
          amenities = JSON.parse(extraInfo.amenities);
          if (!Array.isArray(amenities)) {
            amenities = [extraInfo.amenities];
          }
        } else if (Array.isArray(extraInfo.amenities)) {
          amenities = extraInfo.amenities;
        }
      } catch (error) {
        console.warn('Failed to parse amenities for venue', venue.id, error);
        amenities = [];
      }

      // Handle photos
      try {
        if (typeof extraInfo.photos === 'string') {
          photos = JSON.parse(extraInfo.photos);
          if (!Array.isArray(photos)) {
            photos = [extraInfo.photos];
          }
        } else if (Array.isArray(extraInfo.photos)) {
          photos = extraInfo.photos;
        }
      } catch (error) {
        console.warn('Failed to parse photos for venue', venue.id, error);
        photos = [];
      }
    }

    const response = {
      ...venue,
      amenities,
      photos,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Get venue details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venue details',
      error: error.message,
    });
  }
};

// Get available time slots for a court
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required',
      });
    }

    // First, verify that the court exists and is active
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

    // Verify venue is approved
    if (!court.venue.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Venue is not available',
      });
    }

    // Calculate day of week for the requested date (0 = Sunday, 1 = Monday, etc.)
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    // Get time slots for the court on the specific day of week
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: parseInt(courtId),
        dayOfWeek: dayOfWeek,
        isAvailable: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get bookings for the specific date to check for conflicts
    const bookings = await prisma.booking.findMany({
      where: {
        courtId: parseInt(courtId),
        bookingDate: new Date(date),
        status: {
          in: ['confirmed', 'pending'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Filter out time slots that conflict with existing bookings
    const availableSlots = timeSlots.filter((slot) => {
      return !bookings.some((booking) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        // Check for time overlap - use proper overlap detection
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });
    });

    // Remove duplicate time slots (same start and end times)
    const uniqueSlots = [];
    const seenTimes = new Set();

    for (const slot of availableSlots) {
      const timeKey = `${slot.startTime.getTime()}-${slot.endTime.getTime()}`;
      if (!seenTimes.has(timeKey)) {
        seenTimes.add(timeKey);
        uniqueSlots.push(slot);
      }
    }

    res.json({
      success: true,
      data: {
        date,
        courtId: parseInt(courtId),
        availableSlots: uniqueSlots.map((slot) => ({
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          formattedStartTime: `${slot.startTime.getUTCHours().toString().padStart(2, '0')}:${slot.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
          formattedEndTime: `${slot.endTime.getUTCHours().toString().padStart(2, '0')}:${slot.endTime.getUTCMinutes().toString().padStart(2, '0')}`,
          isAvailable: slot.isAvailable,
        })),
      },
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

// Get all time slots for a court with availability status (including conflicts)
export const getAllCourtTimeSlots = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    // Get court details with venue info
    const court = await prisma.court.findFirst({
      where: {
        id: parseInt(courtId),
        isActive: true,
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
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

    // Verify venue is approved
    if (!court.venue.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Venue is not available',
      });
    }

    // Calculate day of week for the requested date (0 = Sunday, 1 = Monday, etc.)
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    // Get ALL time slots for the court on the specific day of week (both available and unavailable)
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: parseInt(courtId),
        dayOfWeek: dayOfWeek,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get bookings for the specific date to check for conflicts
    const bookings = await prisma.booking.findMany({
      where: {
        courtId: parseInt(courtId),
        bookingDate: new Date(date),
        status: {
          in: ['confirmed', 'pending'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Process all time slots with availability status
    const processedSlots = timeSlots.map((slot) => {
      // Check if this slot conflicts with any booking
      const conflictingBooking = bookings.find((booking) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        // Check for time overlap
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });

      // Determine availability status
      const isAvailableForBooking = slot.isAvailable && !conflictingBooking;

      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        formattedStartTime: `${slot.startTime.getUTCHours().toString().padStart(2, '0')}:${slot.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
        formattedEndTime: `${slot.endTime.getUTCHours().toString().padStart(2, '0')}:${slot.endTime.getUTCMinutes().toString().padStart(2, '0')}`,
        isAvailable: isAvailableForBooking,
        isBlocked: !slot.isAvailable, // Slot is blocked by venue owner
        hasConflict: !!conflictingBooking,
        conflictReason: conflictingBooking 
          ? `Booked by ${conflictingBooking.user.name}`
          : slot.isAvailable 
            ? null 
            : 'Blocked by venue',
      };
    });

    // Remove duplicate time slots (same start and end times)
    const uniqueSlots = [];
    const seenTimes = new Set();

    for (const slot of processedSlots) {
      const timeKey = `${slot.startTime.getTime()}-${slot.endTime.getTime()}`;
      if (!seenTimes.has(timeKey)) {
        seenTimes.add(timeKey);
        uniqueSlots.push(slot);
      }
    }

    res.json({
      success: true,
      data: {
        date,
        courtId: parseInt(courtId),
        court: {
          id: court.id,
          name: court.name,
          pricePerHour: court.pricePerHour,
          sportType: court.sportType,
          venue: court.venue,
        },
        allSlots: uniqueSlots,
        availableSlots: uniqueSlots.filter(slot => slot.isAvailable),
        unavailableSlots: uniqueSlots.filter(slot => !slot.isAvailable),
      },
    });
  } catch (error) {
    console.error('Get all court time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch court time slots',
      error: error.message,
    });
  }
};

// Get popular venues
export const getPopularVenues = async (req, res) => {
  try {
    const { type = 'rating', limit = 10 } = req.query;
    const limitInt = parseInt(limit);

    let venues;
    
    // Use different queries based on type to avoid SQL injection
    if (type === 'bookings') {
      venues = await prisma.$queryRaw`
        SELECT v.*,
               (SELECT COUNT(*) FROM bookings b WHERE b.venue_id = v.id AND b.status = 'confirmed') as booking_count,
               (SELECT COUNT(*) FROM reviews r WHERE r.venue_id = v.id) as review_count
        FROM venues v
        WHERE v.is_approved = true
        ORDER BY booking_count DESC, v.rating DESC
        LIMIT ${limitInt}
      `;
    } else {
      venues = await prisma.$queryRaw`
        SELECT v.*,
               (SELECT COUNT(*) FROM bookings b WHERE b.venue_id = v.id AND b.status = 'confirmed') as booking_count,
               (SELECT COUNT(*) FROM reviews r WHERE r.venue_id = v.id) as review_count
        FROM venues v
        WHERE v.is_approved = true
        ORDER BY v.rating DESC, v.total_reviews DESC
        LIMIT ${limitInt}
      `;
    }

    // Process venues and fix amenities format + convert BigInt to Number
    const processedVenues = venues.map((venue) => {
      let amenities = [];
      try {
        if (typeof venue.amenities === 'string') {
          // Try to parse as JSON array
          amenities = JSON.parse(venue.amenities);
          if (!Array.isArray(amenities)) {
            amenities = [venue.amenities]; // If it's a single string, make it an array
          }
        } else if (Array.isArray(venue.amenities)) {
          amenities = venue.amenities;
        }
      } catch (error) {
        console.warn('Failed to parse amenities for venue', venue.id, error);
        amenities = [];
      }

      let photos = [];
      try {
        if (typeof venue.photos === 'string') {
          photos = JSON.parse(venue.photos);
          if (!Array.isArray(photos)) {
            photos = [venue.photos];
          }
        } else if (Array.isArray(venue.photos)) {
          photos = venue.photos;
        }
      } catch (error) {
        console.warn('Failed to parse photos for venue', venue.id, error);
        photos = [];
      }

      // Convert all potential BigInt values to Numbers
      const processedVenue = {};
      Object.keys(venue).forEach(key => {
        const value = venue[key];
        if (typeof value === 'bigint') {
          processedVenue[key] = Number(value);
        } else {
          processedVenue[key] = value;
        }
      });

      return {
        ...processedVenue,
        amenities,
        photos,
        bookingCount: Number(venue.booking_count || 0),
        reviewCount: Number(venue.review_count || 0),
      };
    });

    // Enrich with pricing and sports data
    const enrichedVenues = await enrichVenueData(processedVenues);

    res.json({
      success: true,
      data: enrichedVenues,
    });
  } catch (error) {
    console.error('Get popular venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular venues',
      error: error.message,
    });
  }
};

// Get available sports
export const getAvailableSports = async (req, res) => {
  try {
    const sports = await prisma.court.findMany({
      where: {
        isActive: true,
        venue: {
          isApproved: true,
        },
      },
      select: {
        sportType: true,
      },
      distinct: ['sportType'],
    });

    const uniqueSports = sports.map((court) => ({
      name: court.sportType,
      description: getSportDescription(court.sportType),
    }));

    res.json({
      success: true,
      data: uniqueSports,
    });
  } catch (error) {
    console.error('Get available sports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available sports',
      error: error.message,
    });
  }
};

// Get sport pricing details by venue and sport
export const getSportPricing = async (req, res) => {
  try {
    const { venueId, sportType } = req.params;

    // Get court pricing information for the specific venue and sport
    const courts = await prisma.court.findMany({
      where: {
        venueId: parseInt(venueId),
        sportType: sportType,
        isActive: true,
        venue: {
          isApproved: true,
        },
      },
      select: {
        id: true,
        name: true,
        pricePerHour: true,
        sportType: true,
        venue: {
          select: {
            name: true,
            operatingHours: true,
          },
        },
      },
      orderBy: {
        pricePerHour: 'asc',
      },
    });

    if (courts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No courts found for this venue and sport type',
      });
    }

    const pricingData = {
      venueId: parseInt(venueId),
      sportType,
      venueName: courts[0].venue.name,
      courts: courts.map((court) => ({
        id: court.id,
        name: court.name,
        pricePerHour: court.pricePerHour,
      })),
      priceRange: {
        min: Math.min(...courts.map((c) => c.pricePerHour)),
        max: Math.max(...courts.map((c) => c.pricePerHour)),
      },
      operatingHours: courts[0].venue.operatingHours,
    };

    res.json({
      success: true,
      data: pricingData,
    });
  } catch (error) {
    console.error('Get sport pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sport pricing',
      error: error.message,
    });
  }
};

// Get venue statistics
export const getVenueStatistics = async (req, res) => {
  try {
    const { venueId } = req.params;

    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        isApproved: true,
      },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: 'confirmed' },
            },
            reviews: true,
            courts: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    const stats = {
      total_bookings: venue._count.bookings,
      total_reviews: venue._count.reviews,
      total_courts: venue._count.courts,
      average_rating: venue.rating,
      total_revenue: 0, // Calculate if needed
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get venue statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venue statistics',
      error: error.message,
    });
  }
};

// Submit a venue report
export const submitVenueReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { venueId, reason, description } = req.body;

    // Check if venue exists and is approved
    const venue = await prisma.venue.findFirst({
      where: {
        id: parseInt(venueId),
        isApproved: true,
      },
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found or not approved',
      });
    }

    // Check if user already has a pending report for this venue
    const existingReport = await prisma.report.findFirst({
      where: {
        userId: req.user.id,
        venueId: parseInt(venueId),
        status: 'pending',
      },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending report for this venue',
      });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        userId: req.user.id,
        venueId: parseInt(venueId),
        reason,
        description,
        status: 'pending',
      },
      include: {
        venue: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        id: report.id,
        reason: report.reason,
        description: report.description,
        venue_name: report.venue.name,
        status: report.status,
        created_at: report.createdAt,
      },
    });
  } catch (error) {
    console.error('Submit venue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message,
    });
  }
};

// Get courts by sport type
export const getCourtsBySport = async (req, res) => {
  try {
    const { sportType } = req.params;
    const { location, date, startTime, endTime } = req.query;

    let whereClause = {
      sportType: sportType,
      isActive: true,
      venue: {
        isApproved: true,
      },
    };

    // Add location filter if provided
    if (location) {
      whereClause.venue.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    const courts = await prisma.court.findMany({
      where: whereClause,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            location: true,
            address: true,
            rating: true,
            amenities: true,
            photos: true,
          },
        },
        timeSlots: {
          where: {
            isAvailable: true,
          },
        },
      },
    });

    // If date and time filters are provided, check availability
    let availableCourts = courts;
    if (date && startTime && endTime) {
      const availabilityPromises = courts.map(async (court) => {
        const bookings = await prisma.booking.findMany({
          where: {
            courtId: court.id,
            bookingDate: new Date(date),
            status: {
              in: ['confirmed', 'pending'],
            },
            // Check for time overlap
            OR: [
              {
                AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
              },
              {
                AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
              },
              {
                AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
              },
            ],
          },
        });

        return {
          ...court,
          isAvailable: bookings.length === 0,
        };
      });

      availableCourts = await Promise.all(availabilityPromises);

      // Filter to only available courts if time filtering is requested
      availableCourts = availableCourts.filter((court) => court.isAvailable);
    }

    // Process venue amenities and photos
    const processedCourts = availableCourts.map((court) => {
      let amenities = [];
      let photos = [];

      try {
        if (typeof court.venue.amenities === 'string') {
          amenities = JSON.parse(court.venue.amenities);
          if (!Array.isArray(amenities)) {
            amenities = [court.venue.amenities];
          }
        } else if (Array.isArray(court.venue.amenities)) {
          amenities = court.venue.amenities;
        }
      } catch (error) {
        console.warn('Failed to parse amenities for venue', court.venue.id, error);
        amenities = [];
      }

      try {
        if (typeof court.venue.photos === 'string') {
          photos = JSON.parse(court.venue.photos);
          if (!Array.isArray(photos)) {
            photos = [court.venue.photos];
          }
        } else if (Array.isArray(court.venue.photos)) {
          photos = court.venue.photos;
        }
      } catch (error) {
        console.warn('Failed to parse photos for venue', court.venue.id, error);
        photos = [];
      }

      return {
        ...court,
        venue: {
          ...court.venue,
          amenities,
          photos,
        },
      };
    });

    res.json({
      success: true,
      data: processedCourts,
    });
  } catch (error) {
    console.error('Get courts by sport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courts by sport',
      error: error.message,
    });
  }
};
