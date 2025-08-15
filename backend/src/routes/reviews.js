import express from 'express';
import { body, query, param } from 'express-validator';
import {
  createReview,
  updateReview,
  deleteReview,
  getVenueReviews,
  getUserReviews,
  markReviewHelpful,
} from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get venue reviews (public)
router.get(
  '/venues/:venueId',
  [
    param('venueId').isInt(),
    query('rating').optional().isInt({ min: 1, max: 5 }),
    query('sortBy').optional().isIn(['created_at', 'rating', 'helpful']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getVenueReviews
);

// Routes that require authentication
router.use(authMiddleware);

// Create a review
router.post(
  '/',
  [
    body('venueId').isInt().withMessage('Venue ID is required'),
    body('bookingId').optional().isInt().withMessage('Booking ID must be a valid integer'),
    body('courtId').optional().isInt(),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().trim().isLength({ max: 1000 }),
  ],
  createReview
);

// Get user's reviews
router.get(
  '/my-reviews',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  getUserReviews
);

// Update a review
router.put(
  '/:reviewId',
  [
    param('reviewId').isInt(),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().trim().isLength({ max: 1000 }),
  ],
  updateReview
);

// Delete a review
router.delete('/:reviewId', [param('reviewId').isInt()], deleteReview);

// Mark review as helpful
router.post('/:reviewId/helpful', [param('reviewId').isInt()], markReviewHelpful);

export default router;
