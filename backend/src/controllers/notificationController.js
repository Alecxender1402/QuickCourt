import { validationResult } from 'express-validator';
import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, isRead, limit = 20, offset = 0 } = req.query;

    // Convert isRead string to boolean if provided
    const isReadBoolean = isRead !== undefined ? isRead === 'true' : undefined;

    const notifications = await Notification.getUserNotifications(userId, {
      type,
      isRead: isReadBoolean,
      limit,
      offset,
    });

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

// Get unread notifications count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message,
    });
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('Mark notification read error:', error);

    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    await Notification.delete(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);

    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
};

// Create notification (internal use)
export const createNotification = async (userId, type, title, message, relatedId = null) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Send booking confirmation notification
export const sendBookingConfirmationNotification = async (booking) => {
  try {
    await Notification.createBookingConfirmation(booking);
    // TODO: Send email notifications
  } catch (error) {
    console.error('Send booking confirmation notification error:', error);
  }
};

// Send booking cancellation notification
export const sendBookingCancellationNotification = async (booking) => {
  try {
    await Notification.createBookingCancellation(booking);
    // TODO: Send email notifications
  } catch (error) {
    console.error('Send booking cancellation notification error:', error);
  }
};

// Send venue approval notification
export const sendVenueApprovalNotification = async (venue) => {
  try {
    await Notification.createVenueApproval(venue);
    // TODO: Send email notification
  } catch (error) {
    console.error('Send venue approval notification error:', error);
  }
};

// Send venue rejection notification
export const sendVenueRejectionNotification = async (venue) => {
  try {
    await Notification.createVenueRejection(venue);
    // TODO: Send email notification
  } catch (error) {
    console.error('Send venue rejection notification error:', error);
  }
};

// Send reminder notifications
export const sendBookingReminders = async () => {
  try {
    const bookings = await Notification.getBookingsForReminders();

    for (const booking of bookings) {
      await createNotification(
        booking.userId,
        'booking_reminder',
        'Booking Reminder',
        `Reminder: You have a booking for ${booking.court.venue.name} - ${booking.court.name} tomorrow at ${booking.startTime}.`,
        booking.id
      );

      // TODO: Send email reminder
    }

    console.log(`Sent ${bookings.length} booking reminders`);
  } catch (error) {
    console.error('Send booking reminders error:', error);
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await NotificationPreference.getByUserId(userId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message,
    });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const preferences = req.body;

    const updatedPreferences = await NotificationPreference.upsert(userId, preferences);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
};
