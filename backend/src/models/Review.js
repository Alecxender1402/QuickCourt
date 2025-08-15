import prisma from '../config/prisma.js';

class Review {
  constructor(reviewData) {
    this.id = reviewData.id;
    this.userId = reviewData.userId;
    this.venueId = reviewData.venueId;
    this.bookingId = reviewData.bookingId;
    this.rating = reviewData.rating;
    this.comment = reviewData.comment;
    this.helpfulCount = reviewData.helpfulCount;
    this.createdAt = reviewData.createdAt;
    this.updatedAt = reviewData.updatedAt;

    // Related data
    this.userName = reviewData.user?.name;
    this.userAvatar = reviewData.user?.avatar;
    this.venueName = reviewData.venue?.name;
    this.isHelpful = reviewData.isHelpful; // Set by queries when checking if current user found it helpful
  }

  // Create a new review
  static async create(reviewData) {
    const { userId, venueId, bookingId, rating, comment } = reviewData;

    try {
      const review = await prisma.review.create({
        data: {
          userId,
          venueId,
          bookingId: bookingId || null,
          rating,
          comment,
        },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
          venue: {
            select: {
              name: true,
            },
          },
        },
      });

      // Update venue rating and mark booking as reviewed if applicable
      await Promise.all([
        this.updateVenueRating(venueId),
        bookingId
          ? prisma.booking.update({
              where: { id: bookingId },
              data: { reviewed: true },
            })
          : null,
      ]);

      return new Review(review);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('You have already reviewed this booking');
      }
      throw error;
    }
  }

  // Find review by ID
  static async findById(id, currentUserId = null) {
    const include = {
      user: {
        select: {
          name: true,
          avatar: true,
        },
      },
      venue: {
        select: {
          name: true,
        },
      },
    };

    // Add helpful check if current user is provided
    if (currentUserId) {
      include.helpfulVotes = {
        where: { userId: currentUserId },
        select: { id: true },
      };
    }

    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
      include,
    });

    if (!review) return null;

    const reviewData = {
      ...review,
      isHelpful: currentUserId ? review.helpfulVotes.length > 0 : false,
    };

    return new Review(reviewData);
  }

  // Get reviews by venue
  static async findByVenue(venueId, limit = 20, offset = 0, currentUserId = null) {
    const include = {
      user: {
        select: {
          name: true,
          avatar: true,
        },
      },
    };

    // Add helpful check if current user is provided
    if (currentUserId) {
      include.helpfulVotes = {
        where: { userId: currentUserId },
        select: { id: true },
      };
    }

    const reviews = await prisma.review.findMany({
      where: { venueId: parseInt(venueId) },
      include,
      orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    return reviews.map((review) => {
      const reviewData = {
        ...review,
        isHelpful: currentUserId ? review.helpfulVotes?.length > 0 : false,
      };
      return new Review(reviewData);
    });
  }

  // Get reviews by user
  static async findByUser(userId, limit = 20, offset = 0) {
    const reviews = await prisma.review.findMany({
      where: { userId: parseInt(userId) },
      include: {
        venue: {
          select: {
            name: true,
            photos: true,
          },
        },
        booking: {
          select: {
            bookingDate: true,
            court: {
              select: {
                name: true,
                sportType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return reviews.map((review) => new Review(review));
  }

  // Get recent reviews across all venues
  static async findRecent(limit = 10) {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
        venue: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return reviews.map((review) => new Review(review));
  }

  // Update review
  async update(updateData) {
    const allowedFields = ['rating', 'comment'];
    const prismaUpdateData = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        prismaUpdateData[key] = updateData[key];
      }
    });

    if (Object.keys(prismaUpdateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const updatedReview = await prisma.review.update({
      where: { id: this.id },
      data: prismaUpdateData,
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
        venue: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update venue rating if rating changed
    if (updateData.rating !== undefined) {
      await this.constructor.updateVenueRating(this.venueId);
    }

    return new Review(updatedReview);
  }

  // Delete review
  async delete() {
    await prisma.review.delete({
      where: { id: this.id },
    });

    // Update venue rating after deletion
    await this.constructor.updateVenueRating(this.venueId);

    return true;
  }

  // Mark review as helpful
  async markHelpful(userId) {
    try {
      await prisma.reviewHelpful.create({
        data: {
          reviewId: this.id,
          userId,
        },
      });

      // Update helpful count
      await prisma.review.update({
        where: { id: this.id },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
      });

      return true;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('You have already marked this review as helpful');
      }
      throw error;
    }
  }

  // Remove helpful mark
  async removeHelpful(userId) {
    const deleted = await prisma.reviewHelpful.deleteMany({
      where: {
        reviewId: this.id,
        userId,
      },
    });

    if (deleted.count > 0) {
      // Update helpful count
      await prisma.review.update({
        where: { id: this.id },
        data: {
          helpfulCount: {
            decrement: 1,
          },
        },
      });
    }

    return deleted.count > 0;
  }

  // Static method to update venue rating
  static async updateVenueRating(venueId) {
    const stats = await prisma.review.aggregate({
      where: { venueId: parseInt(venueId) },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.venue.update({
      where: { id: parseInt(venueId) },
      data: {
        rating: stats._avg.rating || 0,
        totalReviews: stats._count.id || 0,
      },
    });
  }

  // Get review statistics for venue
  static async getVenueStats(venueId) {
    const [ratingStats, totalCount] = await Promise.all([
      prisma.review.groupBy({
        by: ['rating'],
        where: { venueId: parseInt(venueId) },
        _count: {
          id: true,
        },
      }),
      prisma.review.count({
        where: { venueId: parseInt(venueId) },
      }),
    ]);

    const stats = {
      totalReviews: totalCount,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };

    let totalRating = 0;

    ratingStats.forEach((stat) => {
      stats.ratingDistribution[stat.rating] = stat._count.id;
      totalRating += stat.rating * stat._count.id;
    });

    if (totalCount > 0) {
      stats.averageRating = totalRating / totalCount;
    }

    return stats;
  }

  // Check if user can review venue
  static async canUserReview(userId, venueId) {
    // Check if user has a completed booking for this venue without a review
    const eligibleBooking = await prisma.booking.findFirst({
      where: {
        userId: parseInt(userId),
        venueId: parseInt(venueId),
        status: 'completed',
        reviewed: false,
      },
    });

    return !!eligibleBooking;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      venueId: this.venueId,
      bookingId: this.bookingId,
      rating: this.rating,
      comment: this.comment,
      helpfulCount: this.helpfulCount,
      isHelpful: this.isHelpful,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      userName: this.userName,
      userAvatar: this.userAvatar,
      venueName: this.venueName,
    };
  }
}

export default Review;
