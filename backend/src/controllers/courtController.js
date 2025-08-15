import Venue from '../models/Venue.js';
import Court from '../models/Court.js';
import { validationResult } from 'express-validator';

// Helper function to verify venue ownership
const verifyVenueOwnership = async (venueId, userId) => {
  const venue = await Venue.findById(venueId);
  if (!venue || venue.ownerId !== userId) {
    return null;
  }
  return venue;
};

// Get all courts for the current facility owner (across all their venues)
export const getAllOwnerCourts = async (req, res) => {
  try {
    console.log('Debug - getAllOwnerCourts called');
    console.log('Debug - User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    
    if (!req.user || !req.user.id) {
      console.log('Debug - No user ID found');
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const userId = req.user.id;
    console.log('Debug - Searching courts for user ID:', userId);

    // Get search and pagination parameters
    const {
      search,
      sportType,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 10,
      offset = 0,
      venueId,
    } = req.query;

    console.log('Debug - Query params:', req.query);

    // Build search parameters
    const searchParams = {
      ownerId: userId,
      search,
      sportType,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      venueId: venueId ? parseInt(venueId) : undefined,
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    console.log('Debug - Search params:', searchParams);

    // Get courts using the Court model search method
    const result = await Court.searchWithPagination(searchParams);
    console.log('Debug - Search result:', { total: result.total, courtsCount: result.courts.length });

    // Convert courts to JSON manually to avoid potential serialization issues
    const courtsData = result.courts.map((court) => {
      try {
        return court.toJSON();
      } catch (err) {
        console.error('Error converting court to JSON:', err);
        // Return a safe version
        return {
          id: court.id,
          venueId: court.venueId,
          name: court.name,
          sportType: court.sportType,
          description: court.description || '',
          pricePerHour: court.pricePerHour ? Number(court.pricePerHour) : 0,
          capacity: court.capacity || 0,
          photos: court.photos || [],
          amenities: court.amenities || [],
          isActive: court.isActive,
          createdAt: court.createdAt,
          updatedAt: court.updatedAt,
          venue: court.venue,
        };
      }
    });

    res.json({
      success: true,
      data: {
        items: courtsData,
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: parseInt(offset) + parseInt(limit) < result.total,
        },
      },
    });
  } catch (error) {
    console.error('Get all owner courts error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courts',
      error: error.message,
    });
  }
};

// Get courts for a specific venue
export const getCourts = async (req, res) => {
  try {
    const { venueId } = req.params;

    // Verify venue ownership
    const venue = await verifyVenueOwnership(venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const courts = await Court.findByVenue(venueId);

    res.json({
      success: true,
      data: courts.map((court) => court.toJSON()),
    });
  } catch (error) {
    console.error('Get courts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courts',
      error: error.message,
    });
  }
};

// Create a new court
export const createCourt = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { venueId } = req.params;

    // Verify venue ownership
    const venue = await verifyVenueOwnership(venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const courtData = {
      ...req.body,
      venueId: parseInt(venueId),
    };

    const court = await Court.create(courtData);

    res.status(201).json({
      success: true,
      message: 'Court created successfully',
      data: court.toJSON(),
    });
  } catch (error) {
    console.error('Create court error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create court',
      error: error.message,
    });
  }
};

// Update a court
export const updateCourt = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { venueId, courtId } = req.params;

    // Verify venue ownership
    const venue = await verifyVenueOwnership(venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const court = await Court.findById(courtId);
    if (!court || court.venueId !== parseInt(venueId)) {
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    const updatedCourt = await court.update(req.body);

    res.json({
      success: true,
      message: 'Court updated successfully',
      data: updatedCourt.toJSON(),
    });
  } catch (error) {
    console.error('Update court error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court',
      error: error.message,
    });
  }
};

// Delete a court
export const deleteCourt = async (req, res) => {
  try {
    const { venueId, courtId } = req.params;

    // Verify venue ownership
    const venue = await verifyVenueOwnership(venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const court = await Court.findById(courtId);
    if (!court || court.venueId !== parseInt(venueId)) {
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    await court.delete();

    res.json({
      success: true,
      message: 'Court deleted successfully',
    });
  } catch (error) {
    console.error('Delete court error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete court',
      error: error.message,
    });
  }
};

// Toggle court active status
export const toggleCourtStatus = async (req, res) => {
  try {
    const { venueId, courtId } = req.params;

    // Verify venue ownership
    const venue = await verifyVenueOwnership(venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const court = await Court.findById(courtId);
    if (!court || court.venueId !== parseInt(venueId)) {
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    const updatedCourt = await court.update({ isActive: !court.isActive });

    res.json({
      success: true,
      message: `Court ${updatedCourt.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedCourt.toJSON(),
    });
  } catch (error) {
    console.error('Toggle court status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court status',
      error: error.message,
    });
  }
};

// Create a new court (general endpoint)
export const createOwnerCourt = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { venueId } = req.body;

    // Verify venue ownership
    const venue = await verifyVenueOwnership(venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - venue not found or not owned by you',
      });
    }

    const courtData = {
      ...req.body,
      venueId: parseInt(venueId),
    };

    const court = await Court.create(courtData);

    res.status(201).json({
      success: true,
      message: 'Court created successfully',
      data: court.toJSON(),
    });
  } catch (error) {
    console.error('Create court error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create court',
      error: error.message,
    });
  }
};

// Update court (general endpoint)
export const updateOwnerCourt = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { courtId } = req.params;
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    // Verify venue ownership
    const venue = await verifyVenueOwnership(court.venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const updatedCourt = await court.update(req.body);

    res.json({
      success: true,
      message: 'Court updated successfully',
      data: updatedCourt.toJSON(),
    });
  } catch (error) {
    console.error('Update court error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court',
      error: error.message,
    });
  }
};

// Delete court (general endpoint)
export const deleteOwnerCourt = async (req, res) => {
  try {
    const { courtId } = req.params;
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    // Verify venue ownership
    const venue = await verifyVenueOwnership(court.venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await court.delete();

    res.json({
      success: true,
      message: 'Court deleted successfully',
    });
  } catch (error) {
    console.error('Delete court error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete court',
      error: error.message,
    });
  }
};

// Toggle court status (general endpoint)
export const toggleOwnerCourtStatus = async (req, res) => {
  try {
    const { courtId } = req.params;
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    // Verify venue ownership
    const venue = await verifyVenueOwnership(court.venueId, req.user.id);
    if (!venue) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const updatedCourt = court.isActive ? await court.deactivate() : await court.activate();

    res.json({
      success: true,
      message: `Court ${updatedCourt.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedCourt.toJSON(),
    });
  } catch (error) {
    console.error('Toggle court status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court status',
      error: error.message,
    });
  }
};
