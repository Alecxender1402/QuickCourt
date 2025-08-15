import prisma from '../config/prisma.js';

class Notification {
  constructor(notificationData) {
    this.id = notificationData.id;
    this.userId = notificationData.userId;
    this.type = notificationData.type;
    this.title = notificationData.title;
    this.message = notificationData.message;
    this.relatedId = notificationData.relatedId;
    this.isRead = notificationData.isRead || false;
    this.readAt = notificationData.readAt;
    this.createdAt = notificationData.createdAt;
  }

  // Create a new notification
  static async create(notificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          relatedId: notificationData.relatedId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return new Notification(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user with filters
  static async getUserNotifications(userId, options = {}) {
    try {
      const { type, isRead, limit = 20, offset = 0 } = options;

      const where = {
        userId: userId,
      };

      if (type) {
        where.type = type;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get related data for each notification
      const notificationsWithRelatedData = await Promise.all(
        notifications.map(async (notification) => {
          let relatedData = null;

          if (notification.relatedId) {
            switch (notification.type) {
              case 'booking_confirmed':
              case 'booking_cancelled':
              case 'booking_rescheduled':
              case 'new_booking':
              case 'booking_reminder':
                relatedData = await prisma.booking.findUnique({
                  where: { id: notification.relatedId },
                  include: {
                    court: {
                      include: {
                        venue: {
                          select: {
                            id: true,
                            name: true,
                            location: true,
                          },
                        },
                      },
                    },
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                });
                if (relatedData) {
                  relatedData = {
                    booking_id: relatedData.id,
                    venue_name: relatedData.court.venue.name,
                    court_name: relatedData.court.name,
                    booking_date: relatedData.bookingDate,
                    start_time: relatedData.startTime,
                    user_name: relatedData.user.name,
                  };
                }
                break;
              case 'venue_approved':
              case 'venue_rejected':
                relatedData = await prisma.venue.findUnique({
                  where: { id: notification.relatedId },
                  select: {
                    id: true,
                    name: true,
                    location: true,
                  },
                });
                if (relatedData) {
                  relatedData = {
                    venue_id: relatedData.id,
                    venue_name: relatedData.name,
                    location: relatedData.location,
                  };
                }
                break;
            }
          }

          return {
            ...notification,
            related_data: relatedData,
          };
        })
      );

      return notificationsWithRelatedData;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Get unread count for a user
  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: parseInt(notificationId),
          userId: userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      if (notification.count === 0) {
        throw new Error('Notification not found');
      }

      // Return the updated notification
      return await prisma.notification.findUnique({
        where: { id: parseInt(notificationId) },
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async delete(notificationId, userId) {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: parseInt(notificationId),
          userId: userId,
        },
      });

      if (result.count === 0) {
        throw new Error('Notification not found');
      }

      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get bookings that need reminders (24 hours before)
  static async getBookingsForReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const bookings = await prisma.booking.findMany({
        where: {
          status: 'confirmed',
          bookingDate: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
          // Check if reminder notification doesn't already exist
          NOT: {
            AND: [
              {
                userId: {
                  in: await prisma.notification
                    .findMany({
                      where: {
                        type: 'booking_reminder',
                        relatedId: {
                          not: null,
                        },
                      },
                      select: {
                        relatedId: true,
                      },
                    })
                    .then((notifications) => notifications.map((n) => n.relatedId).filter(Boolean)),
                },
              },
            ],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          court: {
            include: {
              venue: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return bookings;
    } catch (error) {
      console.error('Error getting bookings for reminders:', error);
      throw error;
    }
  }

  // Create booking confirmation notification
  static async createBookingConfirmation(booking) {
    try {
      const notifications = [];

      // Notify the customer
      const customerNotification = await this.create({
        userId: booking.userId,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your booking for ${booking.court?.venue?.name} - ${booking.court?.name} on ${booking.bookingDate?.toDateString()} has been confirmed.`,
        relatedId: booking.id,
      });
      notifications.push(customerNotification);

      // Notify the venue owner
      if (booking.court?.venue?.ownerId) {
        const ownerNotification = await this.create({
          userId: booking.court.venue.ownerId,
          type: 'new_booking',
          title: 'New Booking Received',
          message: `You have a new booking for ${booking.court.name} on ${booking.bookingDate?.toDateString()} from ${booking.user?.name}.`,
          relatedId: booking.id,
        });
        notifications.push(ownerNotification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating booking confirmation notifications:', error);
      throw error;
    }
  }

  // Create booking cancellation notification
  static async createBookingCancellation(booking) {
    try {
      const notifications = [];

      // Notify the customer
      const customerNotification = await this.create({
        userId: booking.userId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.court?.venue?.name} - ${booking.court?.name} on ${booking.bookingDate?.toDateString()} has been cancelled.`,
        relatedId: booking.id,
      });
      notifications.push(customerNotification);

      // Notify the venue owner
      if (booking.court?.venue?.ownerId) {
        const ownerNotification = await this.create({
          userId: booking.court.venue.ownerId,
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: `A booking for ${booking.court.name} on ${booking.bookingDate?.toDateString()} has been cancelled by ${booking.user?.name}.`,
          relatedId: booking.id,
        });
        notifications.push(ownerNotification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating booking cancellation notifications:', error);
      throw error;
    }
  }

  // Create venue approval notification
  static async createVenueApproval(venue) {
    try {
      return await this.create({
        userId: venue.ownerId,
        type: 'venue_approved',
        title: 'Venue Approved',
        message: `Congratulations! Your venue "${venue.name}" has been approved and is now live on our platform.`,
        relatedId: venue.id,
      });
    } catch (error) {
      console.error('Error creating venue approval notification:', error);
      throw error;
    }
  }

  // Create venue rejection notification
  static async createVenueRejection(venue) {
    try {
      return await this.create({
        userId: venue.ownerId,
        type: 'venue_rejected',
        title: 'Venue Application Rejected',
        message: `Your venue application for "${venue.name}" has been rejected. Reason: ${venue.rejectionReason || 'Please contact support for details.'}`,
        relatedId: venue.id,
      });
    } catch (error) {
      console.error('Error creating venue rejection notification:', error);
      throw error;
    }
  }
}

export default Notification;
