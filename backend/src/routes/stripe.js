import express from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getStripeConfig,
  createCheckoutSession,
  handleCheckoutSuccess,
  cancelBooking,
} from '../controllers/stripeController.js';

const router = express.Router();

// Get Stripe configuration (publishable key)
router.get('/config', getStripeConfig);

// Handle checkout success (public route for Stripe redirect)
router.get('/checkout-success', handleCheckoutSuccess);

// Create Stripe Checkout Session (requires authentication)
router.post(
  '/create-checkout-session',
  [
    authMiddleware,
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be a positive number'),
    body('currency')
      .optional()
      .isIn(['inr', 'usd'])
      .withMessage('Currency must be INR or USD'),
    body('bookingData')
      .isObject()
      .withMessage('Booking data is required'),
    body('bookingData.venueId')
      .isInt({ min: 1 })
      .withMessage('Valid venue ID is required'),
    body('bookingData.courtId')
      .isInt({ min: 1 })
      .withMessage('Valid court ID is required'),
    body('bookingData.date')
      .isString()
      .notEmpty()
      .withMessage('Valid date is required'),
    body('bookingData.startTime')
      .isString()
      .notEmpty()
      .withMessage('Start time is required'),
    body('bookingData.endTime')
      .isString()
      .notEmpty()
      .withMessage('End time is required'),
    body('successUrl')
      .isString()
      .notEmpty()
      .custom((value) => {
        // Accept localhost:8080 (frontend) URLs
        if (value.startsWith('http://localhost:8080') || value.startsWith('https://')) {
          return true;
        }
        throw new Error('Valid success URL is required');
      }),
    body('cancelUrl')
      .isString()
      .notEmpty()
      .custom((value) => {
        // Accept localhost:8080 (frontend) URLs  
        if (value.startsWith('http://localhost:8080') || value.startsWith('https://')) {
          return true;
        }
        throw new Error('Valid cancel URL is required');
      }),
    handleValidationErrors,
  ],
  createCheckoutSession
);

// All other routes require authentication
router.use(authMiddleware);

// Create payment intent
router.post(
  '/create-payment-intent',
  [
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be a positive number'),
    body('currency')
      .optional()
      .isIn(['inr', 'usd'])
      .withMessage('Currency must be INR or USD'),
    body('bookingData')
      .isObject()
      .withMessage('Booking data is required'),
    body('bookingData.venueId')
      .isInt({ min: 1 })
      .withMessage('Valid venue ID is required'),
    body('bookingData.courtId')
      .isInt({ min: 1 })
      .withMessage('Valid court ID is required'),
    body('bookingData.date')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('bookingData.startTime')
      .isString()
      .notEmpty()
      .withMessage('Start time is required'),
    body('bookingData.endTime')
      .isString()
      .notEmpty()
      .withMessage('End time is required'),
    handleValidationErrors,
  ],
  createPaymentIntent
);

// Confirm payment and create booking
router.post(
  '/confirm-payment',
  [
    body('paymentIntentId')
      .isString()
      .notEmpty()
      .withMessage('Payment intent ID is required'),
    body('bookingData')
      .isObject()
      .withMessage('Booking data is required'),
    body('bookingData.venueId')
      .isInt({ min: 1 })
      .withMessage('Valid venue ID is required'),
    body('bookingData.courtId')
      .isInt({ min: 1 })
      .withMessage('Valid court ID is required'),
    body('bookingData.date')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('bookingData.startTime')
      .isString()
      .notEmpty()
      .withMessage('Start time is required'),
    body('bookingData.endTime')
      .isString()
      .notEmpty()
      .withMessage('End time is required'),
    handleValidationErrors,
  ],
  confirmPayment
);

// Get payment status
router.get(
  '/payment-intent/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Payment intent ID is required'),
    handleValidationErrors,
  ],
  getPaymentStatus
);

// Cancel booking
router.post(
  '/cancel-booking/:bookingId',
  [
    authMiddleware,
    param('bookingId')
      .isInt({ min: 1 })
      .withMessage('Valid booking ID is required'),
    body('reason')
      .optional()
      .isString()
      .withMessage('Cancellation reason must be a string'),
    handleValidationErrors,
  ],
  cancelBooking
);

export default router;
