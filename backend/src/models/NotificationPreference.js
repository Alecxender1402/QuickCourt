import prisma from '../config/prisma.js';

class NotificationPreference {
  constructor(preferenceData) {
    this.id = preferenceData.id;
    this.userId = preferenceData.userId;
    this.emailBookings = preferenceData.emailBookings;
    this.emailReminders = preferenceData.emailReminders;
    this.emailPromotions = preferenceData.emailPromotions;
    this.pushBookings = preferenceData.pushBookings;
    this.pushReminders = preferenceData.pushReminders;
    this.pushPromotions = preferenceData.pushPromotions;
    this.smsBookings = preferenceData.smsBookings;
    this.smsReminders = preferenceData.smsReminders;
    this.createdAt = preferenceData.createdAt;
    this.updatedAt = preferenceData.updatedAt;
  }

  // Get user notification preferences
  static async getByUserId(userId) {
    try {
      const preferences = await prisma.notificationPreference.findUnique({
        where: {
          userId: userId,
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

      if (!preferences) {
        // Return default preferences if none exist
        return {
          userId: userId,
          emailBookings: true,
          emailReminders: true,
          emailPromotions: false,
          pushBookings: true,
          pushReminders: true,
          pushPromotions: false,
          smsBookings: false,
          smsReminders: true,
        };
      }

      return new NotificationPreference(preferences);
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  // Create or update notification preferences
  static async upsert(userId, preferenceData) {
    try {
      const preferences = await prisma.notificationPreference.upsert({
        where: {
          userId: userId,
        },
        update: {
          emailBookings: preferenceData.emailBookings,
          emailReminders: preferenceData.emailReminders,
          emailPromotions: preferenceData.emailPromotions,
          pushBookings: preferenceData.pushBookings,
          pushReminders: preferenceData.pushReminders,
          pushPromotions: preferenceData.pushPromotions,
          smsBookings: preferenceData.smsBookings,
          smsReminders: preferenceData.smsReminders,
          updatedAt: new Date(),
        },
        create: {
          userId: userId,
          emailBookings: preferenceData.emailBookings ?? true,
          emailReminders: preferenceData.emailReminders ?? true,
          emailPromotions: preferenceData.emailPromotions ?? false,
          pushBookings: preferenceData.pushBookings ?? true,
          pushReminders: preferenceData.pushReminders ?? true,
          pushPromotions: preferenceData.pushPromotions ?? false,
          smsBookings: preferenceData.smsBookings ?? false,
          smsReminders: preferenceData.smsReminders ?? true,
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

      return new NotificationPreference(preferences);
    } catch (error) {
      console.error('Error upserting notification preferences:', error);
      throw error;
    }
  }

  // Check if user wants email notifications for a specific type
  static async wantsEmailNotification(userId, type) {
    try {
      const preferences = await this.getByUserId(userId);

      switch (type) {
        case 'booking':
        case 'booking_confirmed':
        case 'booking_cancelled':
        case 'new_booking':
          return preferences.emailBookings;
        case 'reminder':
        case 'booking_reminder':
          return preferences.emailReminders;
        case 'promotion':
        case 'promotional':
          return preferences.emailPromotions;
        default:
          return preferences.emailBookings; // Default to booking notifications
      }
    } catch (error) {
      console.error('Error checking email notification preference:', error);
      return true; // Default to sending if error
    }
  }

  // Check if user wants push notifications for a specific type
  static async wantsPushNotification(userId, type) {
    try {
      const preferences = await this.getByUserId(userId);

      switch (type) {
        case 'booking':
        case 'booking_confirmed':
        case 'booking_cancelled':
        case 'new_booking':
          return preferences.pushBookings;
        case 'reminder':
        case 'booking_reminder':
          return preferences.pushReminders;
        case 'promotion':
        case 'promotional':
          return preferences.pushPromotions;
        default:
          return preferences.pushBookings; // Default to booking notifications
      }
    } catch (error) {
      console.error('Error checking push notification preference:', error);
      return true; // Default to sending if error
    }
  }

  // Check if user wants SMS notifications for a specific type
  static async wantsSmsNotification(userId, type) {
    try {
      const preferences = await this.getByUserId(userId);

      switch (type) {
        case 'booking':
        case 'booking_confirmed':
        case 'booking_cancelled':
        case 'new_booking':
          return preferences.smsBookings;
        case 'reminder':
        case 'booking_reminder':
          return preferences.smsReminders;
        default:
          return preferences.smsBookings; // Default to booking notifications
      }
    } catch (error) {
      console.error('Error checking SMS notification preference:', error);
      return false; // Default to not sending SMS if error
    }
  }

  // Get all users who want a specific type of notification
  static async getUsersForNotificationType(type, method = 'email') {
    try {
      let whereCondition;

      switch (method) {
        case 'email':
          switch (type) {
            case 'booking':
              whereCondition = { emailBookings: true };
              break;
            case 'reminder':
              whereCondition = { emailReminders: true };
              break;
            case 'promotion':
              whereCondition = { emailPromotions: true };
              break;
            default:
              whereCondition = { emailBookings: true };
          }
          break;
        case 'push':
          switch (type) {
            case 'booking':
              whereCondition = { pushBookings: true };
              break;
            case 'reminder':
              whereCondition = { pushReminders: true };
              break;
            case 'promotion':
              whereCondition = { pushPromotions: true };
              break;
            default:
              whereCondition = { pushBookings: true };
          }
          break;
        case 'sms':
          switch (type) {
            case 'booking':
              whereCondition = { smsBookings: true };
              break;
            case 'reminder':
              whereCondition = { smsReminders: true };
              break;
            default:
              whereCondition = { smsBookings: true };
          }
          break;
        default:
          whereCondition = { emailBookings: true };
      }

      const preferences = await prisma.notificationPreference.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return preferences.map((p) => p.user);
    } catch (error) {
      console.error('Error getting users for notification type:', error);
      throw error;
    }
  }

  // Delete user preferences
  static async delete(userId) {
    try {
      const result = await prisma.notificationPreference.delete({
        where: {
          userId: userId,
        },
      });

      return result;
    } catch (error) {
      console.error('Error deleting notification preferences:', error);
      throw error;
    }
  }
}

export default NotificationPreference;
