import express from 'express';
import { body, query, param } from 'express-validator';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get(
  '/',
  [
    query('type')
      .optional()
      .isIn([
        'booking_confirmed',
        'booking_cancelled',
        'booking_reminder',
        'venue_approved',
        'venue_rejected',
        'new_booking',
      ]),
    query('isRead').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getUserNotifications
);

// Get unread notifications count
router.get('/unread-count', getUnreadNotificationCount);

// Mark notification as read
router.patch('/:notificationId/read', [param('notificationId').isInt()], markNotificationRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsRead);

// Delete notification
router.delete('/:notificationId', [param('notificationId').isInt()], deleteNotification);

// Get notification preferences
router.get('/preferences', getNotificationPreferences);

// Update notification preferences
router.put(
  '/preferences',
  [
    body('email_bookings').optional().isBoolean(),
    body('email_reminders').optional().isBoolean(),
    body('email_promotions').optional().isBoolean(),
    body('push_bookings').optional().isBoolean(),
    body('push_reminders').optional().isBoolean(),
    body('push_promotions').optional().isBoolean(),
    body('sms_bookings').optional().isBoolean(),
    body('sms_reminders').optional().isBoolean(),
  ],
  updateNotificationPreferences
);

export default router;
