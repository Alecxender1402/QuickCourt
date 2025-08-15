import Venue from '../models/Venue.js';
import Court from '../models/Court.js';
import Booking from '../models/Booking.js';
import prisma from '../config/prisma.js';
import { validationResult } from 'express-validator';

// Helper function to get venue statistics
const getVenueStats = async (ownerId) => {
  try {
    // Get venue counts
    const totalVenues = await prisma.venue.count({
      where: { ownerId: ownerId },
    });

    const approvedVenues = await prisma.venue.count({
      where: {
        ownerId: ownerId,
        isApproved: true,
      },
    });

    const pendingVenues = await prisma.venue.count({
      where: {
        ownerId: ownerId,
        isApproved: false,
      },
    });

    // Get court counts
    const totalCourts = await prisma.court.count({
      where: {
        venue: { ownerId: ownerId },
      },
    });

    const activeCourts = await prisma.court.count({
      where: {
        venue: { ownerId: ownerId },
        isActive: true,
      },
    });

    // Get booking statistics
    const bookingStats = await prisma.booking.aggregate({
      where: {
        venue: { ownerId: ownerId },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const confirmedBookings = await prisma.booking.count({
      where: {
        venue: { ownerId: ownerId },
        status: 'confirmed',
      },
    });

    return {
      total_venues: totalVenues,
      total_courts: totalCourts,
      approved_venues: approvedVenues,
      pending_venues: pendingVenues,
      active_courts: activeCourts,
      total_bookings: bookingStats._count.id || 0,
      confirmed_bookings: confirmedBookings,
      total_revenue: bookingStats._sum.totalAmount || 0,
    };
  } catch (error) {
    console.error('Error getting venue stats:', error);
    throw error;
  }
};

// Helper function to get recent bookings
const getRecentBookings = async (ownerId, limit = 10) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        venue: { ownerId: ownerId },
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
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
    });

    // Transform to match expected format
    return bookings.map((booking) => ({
      ...booking,
      court_name: booking.court.name,
      sport_type: booking.court.sportType,
      venue_name: booking.venue.name,
      user_name: booking.user.name,
      user_email: booking.user.email,
    }));
  } catch (error) {
    console.error('Error getting recent bookings:', error);
    throw error;
  }
};

// Helper function to get revenue data (simplified)
const getRevenueData = async (ownerId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total revenue and count for last 30 days
    const revenueStats = await prisma.booking.aggregate({
      where: {
        venue: { ownerId: ownerId },
        status: 'confirmed',
        bookingDate: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return {
      total_revenue: revenueStats._sum.totalAmount || 0,
      total_bookings: revenueStats._count.id || 0,
      period: '30 days',
    };
  } catch (error) {
    console.error('Error getting revenue data:', error);
    throw error;
  }
};

// Get dashboard statistics
export const getDashboard = async (req, res) => {
  try {
    const ownerId = req.user.userId || req.user.id;

    // Get venue statistics
    const venueStats = await getVenueStats(ownerId);

    // Get recent bookings
    const recentBookings = await getRecentBookings(ownerId, 10);

    // Get revenue data for current month
    const revenueData = await getRevenueData(ownerId);

    res.json({
      success: true,
      data: {
        stats: venueStats,
        recentBookings,
        revenue: revenueData,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

// Get all venues owned by the user
export const getVenues = async (req, res) => {
  try {
    const ownerId = req.user.userId || req.user.id;

    // Use Prisma directly to avoid model conversion issues
    const venues = await prisma.venue.findMany({
      where: {
        ownerId: ownerId,
      },
      include: {
        courts: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            courts: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to include court counts and format properly
    const venuesWithCourts = venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      description: venue.description,
      address: venue.address,
      location: venue.location,
      amenities: venue.amenities || [],
      photos: venue.photos || [],
      rating: parseFloat(venue.rating) || 0,
      totalReviews: venue.totalReviews || 0,
      ownerId: venue.ownerId,
      isApproved: venue.isApproved,
      contactEmail: venue.contactEmail,
      contactPhone: venue.contactPhone,
      approvedBy: venue.approvedBy,
      approvedAt: venue.approvedAt,
      rejectedBy: venue.rejectedBy,
      rejectedAt: venue.rejectedAt,
      rejectionReason: venue.rejectionReason,
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt,
      courtsCount: venue._count.courts,
      bookingsCount: venue._count.bookings,
      reviewsCount: venue._count.reviews,
      courts: venue.courts.map((court) => ({
        id: court.id,
        venueId: court.venueId,
        name: court.name,
        sportType: court.sportType,
        pricePerHour: parseFloat(court.pricePerHour) || 0,
        description: court.description,
        photos: court.photos || [],
        amenities: court.amenities || [],
        isActive: court.isActive,
        createdAt: court.createdAt,
        updatedAt: court.updatedAt,
      })),
    }));

    res.json({
      success: true,
      data: venuesWithCourts,
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venues',
      error: error.message,
    });
  }
};

// Create a new venue
export const createVenue = async (req, res) => {
  try {
    console.log('🔍 Create venue request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User object:', JSON.stringify(req.user, null, 2));
    console.log('🔍 Uploaded files:', req.files);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { courts, ...venueFields } = req.body;

    // Parse JSON fields if they come as strings (due to multipart form data)
    let parsedAmenities = [];
    let parsedCourts = [];

    try {
      if (typeof venueFields.amenities === 'string') {
        parsedAmenities = JSON.parse(venueFields.amenities);
      } else if (Array.isArray(venueFields.amenities)) {
        parsedAmenities = venueFields.amenities;
      }
    } catch (e) {
      parsedAmenities = Array.isArray(venueFields.amenities) ? venueFields.amenities : [];
    }

    try {
      if (typeof courts === 'string') {
        parsedCourts = JSON.parse(courts);
      } else if (Array.isArray(courts)) {
        parsedCourts = courts;
      }
    } catch (e) {
      parsedCourts = Array.isArray(courts) ? courts : [];
    }

    // Process uploaded images
    const photoUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        photoUrls.push(file.path); // Cloudinary URL
      });
    }

    // Prepare venue data
    const venueData = {
      name: venueFields.name,
      description: venueFields.description || null,
      address: venueFields.address,
      location: venueFields.location,
      amenities: parsedAmenities,
      photos: photoUrls, // Use uploaded Cloudinary URLs
      contactEmail: venueFields.contactEmail || null,
      contactPhone: venueFields.contactPhone || null,
      ownerId: req.user.userId || req.user.id,
      isApproved: false, // New venues need approval
    };

    console.log('🔍 Creating venue with data:', JSON.stringify(venueData, null, 2));

    // Create venue first using Prisma
    const venue = await prisma.venue.create({
      data: venueData,
    });

    console.log('✅ Venue created successfully:', venue.id);

    let createdCourts = [];

    // If courts are provided, create them
    if (parsedCourts && Array.isArray(parsedCourts) && parsedCourts.length > 0) {
      try {
        // Validate court data
        for (let i = 0; i < parsedCourts.length; i++) {
          const court = parsedCourts[i];
          if (!court.name || !court.sportType || !court.pricePerHour) {
            throw new Error(`Court ${i + 1}: name, sportType, and pricePerHour are required`);
          }
          if (court.pricePerHour <= 0) {
            throw new Error(`Court ${i + 1}: pricePerHour must be greater than 0`);
          }
        }

        // Create courts for the venue using Prisma
        for (const courtData of parsedCourts) {
          console.log('🔍 Creating court with data:', JSON.stringify(courtData, null, 2));

          const courtCreateData = {
            venueId: venue.id, // Use the created venue's ID
            name: courtData.name,
            sportType: courtData.sportType,
            pricePerHour: parseFloat(courtData.pricePerHour),
            description: courtData.description || null,
            photos: courtData.photos || [],
            amenities: courtData.amenities || [],
            isActive: true,
          };

          const court = await prisma.court.create({
            data: courtCreateData,
          });

          createdCourts.push({
            id: court.id,
            venueId: court.venueId,
            name: court.name,
            sportType: court.sportType,
            pricePerHour: parseFloat(court.pricePerHour),
            description: court.description,
            photos: court.photos || [],
            amenities: court.amenities || [],
            isActive: court.isActive,
            createdAt: court.createdAt,
            updatedAt: court.updatedAt,
          });
        }

        console.log('✅ Created', createdCourts.length, 'courts for venue');
      } catch (courtError) {
        console.error('❌ Court creation error:', courtError.message);

        // Return success for venue but note court creation issues
        return res.status(201).json({
          success: true,
          message:
            'Venue created successfully. Awaiting admin approval. Some courts could not be created.',
          data: {
            venue: {
              id: venue.id,
              name: venue.name,
              description: venue.description,
              address: venue.address,
              location: venue.location,
              amenities: venue.amenities || [],
              photos: venue.photos || [],
              contactEmail: venue.contactEmail,
              contactPhone: venue.contactPhone,
              isApproved: venue.isApproved,
              ownerId: venue.ownerId,
              createdAt: venue.createdAt,
              updatedAt: venue.updatedAt,
            },
            courts: createdCourts,
            courtErrors: courtError.message,
          },
        });
      }
    }

    // Return success response
    res.status(201).json({
      success: true,
      message:
        courts && courts.length > 0
          ? `Venue created successfully with ${createdCourts.length} courts. Awaiting admin approval.`
          : 'Venue created successfully. Awaiting admin approval.',
      data: {
        venue: {
          id: venue.id,
          name: venue.name,
          description: venue.description,
          address: venue.address,
          location: venue.location,
          amenities: venue.amenities || [],
          photos: venue.photos || [],
          contactEmail: venue.contactEmail,
          contactPhone: venue.contactPhone,
          isApproved: venue.isApproved,
          ownerId: venue.ownerId,
          createdAt: venue.createdAt,
          updatedAt: venue.updatedAt,
        },
        courts: createdCourts,
      },
    });
  } catch (error) {
    console.error('❌ Create venue error details:', {
      message: error.message,
      stack: error.stack,
      user: req.user,
      body: req.body,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create venue',
      error: error.message,
    });
  }
};

// Get a specific venue
export const getVenue = async (req, res) => {
  try {
    const { venueId } = req.params;
    const venue = await Venue.findById(venueId);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    // Check ownership
    if (venue.ownerId !== (req.user.userId || req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own venues.',
      });
    }

    // Get courts for this venue
    const courts = await Court.findByVenue(venue.id);

    res.json({
      success: true,
      data: {
        ...venue.toJSON(),
        courts: courts.map((court) => court.toJSON()),
      },
    });
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venue',
      error: error.message,
    });
  }
};

// Update a venue
export const updateVenue = async (req, res) => {
  try {
    console.log('🔍 Update venue request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Uploaded files:', req.files);

    // Note: Validation is handled by middleware, but this is a backup check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { venueId } = req.params;
    
    // Find venue using Prisma
    const venue = await prisma.venue.findUnique({
      where: { id: parseInt(venueId) }
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    // Check ownership
    if (venue.ownerId !== (req.user.userId || req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own venues.',
      });
    }

    // Parse JSON fields if they come as strings (due to multipart form data)
    let parsedAmenities = [];
    try {
      if (typeof req.body.amenities === 'string') {
        parsedAmenities = JSON.parse(req.body.amenities);
      } else if (Array.isArray(req.body.amenities)) {
        parsedAmenities = req.body.amenities;
      }
    } catch (e) {
      parsedAmenities = Array.isArray(req.body.amenities) ? req.body.amenities : [];
    }

    // Handle image updates
    let updatedPhotos = venue.photos || [];

    // If existingImages are provided, use them as the base
    if (req.body.existingImages) {
      const existingImages = Array.isArray(req.body.existingImages) 
        ? req.body.existingImages 
        : Object.values(req.body).filter(key => key.toString().startsWith('existingImages'));
      
      updatedPhotos = existingImages.filter(img => img && img.trim() !== '');
    } else if (req.files && req.files.length > 0) {
      // If no existing images specified but new files uploaded, replace all
      updatedPhotos = [];
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        updatedPhotos.push(file.path); // Cloudinary URL
      });
    }

    // Prepare update data
    const updateData = {
      name: req.body.name || venue.name,
      description: req.body.description || venue.description,
      address: req.body.address || venue.address,
      location: req.body.location || venue.location,
      amenities: parsedAmenities.length > 0 ? parsedAmenities : venue.amenities,
      photos: updatedPhotos,
      contactEmail: req.body.contactEmail || venue.contactEmail,
      contactPhone: req.body.contactPhone || venue.contactPhone,
    };

    console.log('🔍 Updating venue with data:', JSON.stringify(updateData, null, 2));

    // Update venue using Prisma
    const updatedVenue = await prisma.venue.update({
      where: { id: parseInt(venueId) },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Venue updated successfully',
      data: updatedVenue,
    });
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update venue',
      error: error.message,
    });
  }
};

// Delete a venue
export const deleteVenue = async (req, res) => {
  try {
    const { venueId } = req.params;
    const venue = await Venue.findById(venueId);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    // Check ownership
    if (venue.ownerId !== (req.user.userId || req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own venues.',
      });
    }

    await venue.delete();

    res.json({
      success: true,
      message: 'Venue deleted successfully',
    });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete venue',
      error: error.message,
    });
  }
};
