import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  requestRefund,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create payment intent
router.post(
  '/create-intent',
  [
    body('bookingId').isInt().withMessage('Booking ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  ],
  createPaymentIntent
);

// Confirm payment
router.post(
  '/confirm',
  [body('paymentIntentId').isString().notEmpty().withMessage('Payment intent ID is required')],
  confirmPayment
);

// Get payment history
router.get(
  '/history',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getPaymentHistory
);

// Process refund
router.post(
  '/refund/:bookingId',
  [
    param('bookingId').isInt(),
    body('reason').optional().isString().trim().isLength({ max: 500 }),
    body('amount').optional().isFloat({ min: 0 }),
  ],
  requestRefund
);

export default router;
