import { validationResult } from 'express-validator';
import prisma from '../config/prisma.js';
import emailService from '../services/emailService.js';

// Admin Dashboard - Get system statistics
export const getAdminDashboard = async (req, res) => {
  try {
    // Get basic stats
    const [
      totalUsers,
      facilityOwners,
      totalVenues,
      approvedVenues,
      pendingVenues,
      totalBookings,
      confirmedBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'admin' } } }),
      prisma.user.count({ where: { role: 'facility_owner' } }),
      prisma.venue.count(),
      prisma.venue.count({ where: { isApproved: true } }),
      prisma.venue.count({ where: { isApproved: false } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.booking.aggregate({
        where: { status: 'confirmed' },
        _sum: { totalAmount: true },
      }),
    ]);

    // Get recent activities
    const [recentVenues, recentBookings] = await Promise.all([
      prisma.venue.findMany({
        include: {
          owner: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.booking.findMany({
        include: {
          venue: { select: { name: true } },
          court: { select: { name: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total_users: totalUsers,
          facility_owners: facilityOwners,
          total_venues: totalVenues,
          approved_venues: approvedVenues,
          pending_venues: pendingVenues,
          total_bookings: totalBookings,
          confirmed_bookings: confirmedBookings,
          total_revenue: parseFloat(totalRevenue._sum.totalAmount || 0),
        },
        recentVenues: recentVenues.map((venue) => ({
          id: venue.id,
          name: venue.name,
          owner_name: venue.owner.name,
          created_at: venue.createdAt,
          is_approved: venue.isApproved,
        })),
        recentBookings: recentBookings.map((booking) => ({
          id: booking.id,
          venue_name: booking.venue.name,
          court_name: booking.court.name,
          user_name: booking.user.name,
          created_at: booking.createdAt,
          status: booking.status,
        })),
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

// Get all venues for admin review
export const getAllVenuesForReview = async (req, res) => {
  try {
    const {
      status = 'pending',
      search,
      location,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = req.query;

    // Build where conditions
    const whereConditions = {};

    if (status === 'pending') {
      whereConditions.isApproved = false;
    } else if (status === 'approved') {
      whereConditions.isApproved = true;
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      whereConditions.location = { contains: location, mode: 'insensitive' };
    }

    // Determine sort order
    const sortField = sortBy === 'created_at' ? 'createdAt' : 'createdAt';
    const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const venues = await prisma.venue.findMany({
      where: whereConditions,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            courts: true,
          },
        },
      },
      orderBy: { [sortField]: order },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.venue.count({
      where: whereConditions,
    });

    res.json({
      success: true,
      data: {
        venues: venues.map((venue) => ({
          id: venue.id,
          name: venue.name,
          description: venue.description,
          address: venue.address,
          location: venue.location,
          amenities: venue.amenities,
          photos: venue.photos,
          rating: venue.rating,
          totalReviews: venue.totalReviews,
          contactEmail: venue.contactEmail,
          contactPhone: venue.contactPhone,
          ownerId: venue.ownerId,
          isApproved: venue.isApproved,
          owner_name: venue.owner.name,
          owner_email: venue.owner.email,
          courts_count: venue._count.courts,
          is_approved: venue.isApproved,
          created_at: venue.createdAt,
          updated_at: venue.updatedAt,
          approved_at: venue.approvedAt,
          approved_by: venue.approvedBy,
          rejected_at: venue.rejectedAt,
          rejected_by: venue.rejectedBy,
          rejection_reason: venue.rejectionReason,
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: parseInt(offset) + parseInt(limit) < total,
        },
      },
    });
  } catch (error) {
    console.error('Get venues for review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venues',
      error: error.message,
    });
  }
};

// Approve or reject a venue
export const reviewVenue = async (req, res) => {
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
    const { action, rejectionReason } = req.body;

    const venue = await prisma.venue.findUnique({
      where: { id: parseInt(venueId) },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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

    if (action === 'approve') {
      await prisma.venue.update({
        where: { id: parseInt(venueId) },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: req.user.id,
        },
      });

      // Send approval email to venue owner
      try {
        await emailService.sendVenueApprovalEmail({
          email: venue.owner.email,
          ownerName: venue.owner.name,
          venueName: venue.name,
          venueId: venue.id,
        });
        console.log(`✅ Venue approval email sent to ${venue.owner.email} for venue: ${venue.name}`);
      } catch (emailError) {
        console.error('❌ Failed to send venue approval email:', emailError.message);
        // Don't fail the approval process if email fails
      }

      res.json({
        success: true,
        message: 'Venue approved successfully',
      });
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
      }

      await prisma.venue.update({
        where: { id: parseInt(venueId) },
        data: {
          rejectionReason,
          rejectedAt: new Date(),
          rejectedBy: req.user.id,
        },
      });

      // Send rejection email to venue owner
      try {
        await emailService.sendVenueRejectionEmail({
          email: venue.owner.email,
          ownerName: venue.owner.name,
          venueName: venue.name,
          rejectionReason,
          venueId: venue.id,
        });
        console.log(`✅ Venue rejection email sent to ${venue.owner.email} for venue: ${venue.name}`);
      } catch (emailError) {
        console.error('❌ Failed to send venue rejection email:', emailError.message);
        // Don't fail the rejection process if email fails
      }

      res.json({
        success: true,
        message: 'Venue rejected successfully',
      });
    }
  } catch (error) {
    console.error('Review venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review venue',
      error: error.message,
    });
  }
};

// Get all users with filters
export const getAllUsers = async (req, res) => {
  try {
    const {
      role,
      search,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = req.query;

    // Build where clause
    let whereClause = {
      role: { not: 'admin' }, // Don't show admin users
    };

    if (role === 'facility_owner') {
      whereClause.role = 'facility_owner';
    } else if (role === 'user') {
      whereClause.role = 'user';
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const validSortFields = ['createdAt', 'name', 'email', 'lastLogin'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            venues: true,
            bookings: true,
          },
        },
      },
      orderBy: {
        [sortField]: order,
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.user.count({
      where: whereClause,
    });

    res.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.isActive,
          is_verified: user.isVerified,
          last_login: user.lastLogin,
          created_at: user.createdAt,
          suspended_at: user.suspendedAt,
          suspension_reason: user.suspensionReason,
          venues_count: user._count.venues,
          bookings_count: user._count.bookings,
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: parseInt(offset) + parseInt(limit) < total,
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

// Suspend or activate a user (ban/unban)
export const updateUserStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { userId } = req.params;
    const { action, reason } = req.body; // action: 'suspend' or 'activate'

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin users',
      });
    }

    if (action === 'suspend') {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          isActive: false,
          suspendedAt: new Date(),
          suspensionReason: reason || 'Suspended by admin',
        },
      });

      // Send suspension email notification
      try {
        await emailService.sendAccountSuspensionEmail({
          email: user.email,
          name: user.name,
          reason: reason || 'Suspended by admin',
        });
        console.log(`✅ Suspension email sent to ${user.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send suspension email:', emailError);
        // Don't fail the entire operation if email fails
      }

      res.json({
        success: true,
        message: 'User suspended successfully and notification email sent',
      });
    } else if (action === 'activate') {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          isActive: true,
          suspendedAt: null,
          suspensionReason: null,
        },
      });

      // Send account reactivation email notification
      try {
        await emailService.sendAccountReactivationEmail({
          email: user.email,
          name: user.name,
        });
        console.log(`✅ Reactivation email sent to ${user.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send reactivation email:', emailError);
        // Don't fail the entire operation if email fails
      }

      res.json({
        success: true,
        message: 'User activated successfully and notification email sent',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "suspend" or "activate"',
      });
    }
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
    });
  }
};

// Get system reports (for user complaints/reports)
export const getSystemReports = async (req, res) => {
  try {
    const { reportType = 'venues', startDate, endDate, limit = 20, offset = 0 } = req.query;

    let reportData = {};
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    switch (reportType) {
      case 'venues':
        // Get venue-related reports/issues
        const problematicVenues = await prisma.venue.findMany({
          where: {
            OR: [{ isApproved: false }, { rejectionReason: { not: null } }],
            ...dateFilter,
          },
          include: {
            owner: { select: { name: true, email: true } },
            _count: { select: { reviews: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
        });

        reportData = {
          venues: problematicVenues.map((venue) => ({
            id: venue.id,
            name: venue.name,
            owner_name: venue.owner.name,
            owner_email: venue.owner.email,
            is_approved: venue.isApproved,
            rejection_reason: venue.rejectionReason,
            reviews_count: venue._count.reviews,
            created_at: venue.createdAt,
          })),
        };
        break;

      case 'users':
        // Get user-related reports
        const suspendedUsers = await prisma.user.findMany({
          where: {
            isActive: false,
            suspendedAt: { not: null },
            ...dateFilter,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            suspendedAt: true,
            suspensionReason: true,
          },
          orderBy: { suspendedAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
        });

        reportData = {
          suspended_users: suspendedUsers,
        };
        break;

      case 'bookings':
        // Get booking-related reports
        const cancelledBookings = await prisma.booking.findMany({
          where: {
            status: 'cancelled',
            cancellationReason: { not: null },
            ...dateFilter,
          },
          include: {
            user: { select: { name: true, email: true } },
            venue: { select: { name: true } },
            court: { select: { name: true } },
          },
          orderBy: { cancelledAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
        });

        reportData = {
          cancelled_bookings: cancelledBookings.map((booking) => ({
            id: booking.id,
            user_name: booking.user.name,
            user_email: booking.user.email,
            venue_name: booking.venue.name,
            court_name: booking.court.name,
            cancellation_reason: booking.cancellationReason,
            cancelled_at: booking.cancelledAt,
            booking_date: booking.bookingDate,
          })),
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Use: venues, users, or bookings',
        });
    }

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Get system reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

// Get chart data for admin dashboard
export const getChartData = async (req, res) => {
  try {
    const { type = 'monthly' } = req.query;

    let chartData = {};

    if (type === 'monthly') {
      // Get data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Get monthly aggregated data
      const monthlyStats = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "created_at") as month,
          COUNT(*) as count,
          'users' as type
        FROM "users"
        WHERE "created_at" >= ${sixMonthsAgo} AND "role" != 'admin'
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY month
      `;

      const monthlyVenues = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "created_at") as month,
          COUNT(*) as count,
          'venues' as type
        FROM "venues"
        WHERE "created_at" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY month
      `;

      const monthlyBookings = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "created_at") as month,
          COUNT(*) as count,
          SUM("total_amount") as revenue,
          'bookings' as type
        FROM "bookings"
        WHERE "created_at" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY month
      `;

      // Format data for charts
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = months[date.getMonth()];

        const users = monthlyStats.find((s) => {
          const statMonth = new Date(s.month);
          return (
            statMonth.getMonth() === date.getMonth() &&
            statMonth.getFullYear() === date.getFullYear()
          );
        });

        const venues = monthlyVenues.find((v) => {
          const venueMonth = new Date(v.month);
          return (
            venueMonth.getMonth() === date.getMonth() &&
            venueMonth.getFullYear() === date.getFullYear()
          );
        });

        const bookings = monthlyBookings.find((b) => {
          const bookingMonth = new Date(b.month);
          return (
            bookingMonth.getMonth() === date.getMonth() &&
            bookingMonth.getFullYear() === date.getFullYear()
          );
        });

        monthlyData.push({
          month: monthName,
          users: parseInt(users?.count) || 0,
          venues: parseInt(venues?.count) || 0,
          bookings: parseInt(bookings?.count) || 0,
          revenue: parseFloat(bookings?.revenue) || 0,
        });
      }

      chartData.monthlyGrowth = monthlyData;
    }

    if (type === 'sports' || type === 'monthly') {
      // Get sport popularity data using the correct field name
      const sportBookings = await prisma.$queryRaw`
        SELECT
          c.sport_type as sport,
          COUNT(b.id) as booking_count
        FROM "courts" c
        LEFT JOIN "bookings" b ON c.id = b."court_id"
        GROUP BY c.sport_type
        ORDER BY booking_count DESC
      `;

      chartData.sportPopularity = sportBookings.map((sport) => ({
        sport: sport.sport,
        bookings: parseInt(sport.booking_count) || 0,
        color: getSportColor(sport.sport),
      }));
    }

    if (type === 'venues' || type === 'monthly') {
      // Get venue status distribution
      const [approved, pending, rejected] = await Promise.all([
        prisma.venue.count({ where: { isApproved: true } }),
        prisma.venue.count({ where: { isApproved: false } }),
        prisma.venue.count({ where: { isApproved: false } }), // For now, treating all unapproved as pending
      ]);

      chartData.venueStatus = [
        { name: 'Active', value: approved, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'Rejected', value: 0, color: '#ef4444' }, // No rejected status in current schema
      ];
    }

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chart data',
      error: error.message,
    });
  }
};

// Get all venue reports for admin review
export const getVenueReports = async (req, res) => {
  try {
    const {
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = req.query;

    // Build where conditions
    const whereConditions = {};

    if (status === 'pending') {
      whereConditions.status = 'pending';
    } else if (status === 'reviewed') {
      whereConditions.status = 'reviewed';
    } else if (status === 'resolved') {
      whereConditions.status = 'resolved';
    }

    // Determine sort order
    const validSortFields = ['createdAt', 'status', 'reason'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const reports = await prisma.report.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            location: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { [sortField]: order },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.report.count({
      where: whereConditions,
    });

    res.json({
      success: true,
      data: {
        reports: reports.map((report) => ({
          id: report.id,
          reason: report.reason,
          description: report.description,
          status: report.status,
          admin_notes: report.adminNotes,
          created_at: report.createdAt,
          reviewed_at: report.reviewedAt,
          user: {
            id: report.user.id,
            name: report.user.name,
            email: report.user.email,
          },
          venue: {
            id: report.venue.id,
            name: report.venue.name,
            location: report.venue.location,
            owner_name: report.venue.owner.name,
            owner_email: report.venue.owner.email,
          },
          reviewed_by: report.reviewer?.name || null,
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: parseInt(offset) + parseInt(limit) < total,
        },
      },
    });
  } catch (error) {
    console.error('Get venue reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venue reports',
      error: error.message,
    });
  }
};

// Update report status (review, resolve, etc.)
export const updateReportStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    const report = await prisma.report.findUnique({
      where: { id: parseInt(reportId) },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use: pending, reviewed, resolved, or dismissed',
      });
    }

    await prisma.report.update({
      where: { id: parseInt(reportId) },
      data: {
        status,
        adminNotes,
        reviewedAt: status !== 'pending' ? new Date() : null,
        reviewedBy: status !== 'pending' ? req.user.id : null,
      },
    });

    res.json({
      success: true,
      message: 'Report status updated successfully',
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message,
    });
  }
};

// Get report statistics for dashboard
export const getReportStats = async (req, res) => {
  try {
    const [totalReports, pendingReports, reviewedReports, resolvedReports, dismissedReports] =
      await Promise.all([
        prisma.report.count(),
        prisma.report.count({ where: { status: 'pending' } }),
        prisma.report.count({ where: { status: 'reviewed' } }),
        prisma.report.count({ where: { status: 'resolved' } }),
        prisma.report.count({ where: { status: 'dismissed' } }),
      ]);

    // Get reports by reason
    const reportsByReason = await prisma.report.groupBy({
      by: ['reason'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Get recent reports
    const recentReports = await prisma.report.findMany({
      include: {
        user: { select: { name: true } },
        venue: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        stats: {
          total_reports: totalReports,
          pending_reports: pendingReports,
          reviewed_reports: reviewedReports,
          resolved_reports: resolvedReports,
          dismissed_reports: dismissedReports,
        },
        reports_by_reason: reportsByReason.map((item) => ({
          reason: item.reason,
          count: item._count.id,
        })),
        recent_reports: recentReports.map((report) => ({
          id: report.id,
          reason: report.reason,
          user_name: report.user.name,
          venue_name: report.venue.name,
          status: report.status,
          created_at: report.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report statistics',
      error: error.message,
    });
  }
};

// Helper function to get sport colors
function getSportColor(sport) {
  const colors = {
    Badminton: '#8884d8',
    Cricket: '#82ca9d',
    Football: '#ffc658',
    Tennis: '#ff7300',
    Basketball: '#00ff88',
    Swimming: '#8dd1e1',
    'Table Tennis': '#d084d0',
  };
  return colors[sport] || '#8884d8';
}
