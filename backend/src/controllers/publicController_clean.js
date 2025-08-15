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
      whereClause.city = { contains: city, mode: 'insensitive' };
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
      const extraInfo = extraData.find((a) => a.id === venue.id);
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

    res.json({
      success: true,
      data: {
        venues: finalVenues,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: parseInt(offset) + parseInt(limit) < total,
        },
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

    // Get all time slots for the court
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: parseInt(courtId),
        isAvailable: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get bookings for the specific date
    const bookings = await prisma.booking.findMany({
      where: {
        courtId: parseInt(courtId),
        date: new Date(date),
        status: {
          in: ['confirmed', 'pending'],
        },
      },
      select: {
        timeSlotId: true,
      },
    });

    const bookedSlotIds = bookings.map((booking) => booking.timeSlotId);

    // Filter out booked time slots
    const availableSlots = timeSlots.filter((slot) => !bookedSlotIds.includes(slot.id));

    res.json({
      success: true,
      data: {
        date,
        courtId: parseInt(courtId),
        availableSlots,
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

// Get popular venues
export const getPopularVenues = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Use raw SQL to avoid Prisma type issues with amenities
    const venues = await prisma.$queryRaw`
      SELECT v.*,
             (SELECT COUNT(*) FROM bookings b WHERE b.venue_id = v.id AND b.status = 'confirmed') as booking_count,
             (SELECT COUNT(*) FROM reviews r WHERE r.venue_id = v.id) as review_count
      FROM venues v
      WHERE v.is_approved = true
      ORDER BY v.rating DESC, v.total_reviews DESC
      LIMIT ${parseInt(limit)}
    `;

    // Process venues and fix amenities format
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

      return {
        ...venue,
        amenities,
        photos,
        bookingCount: parseInt(venue.booking_count) || 0,
        reviewCount: parseInt(venue.review_count) || 0,
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
            date: new Date(date),
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
