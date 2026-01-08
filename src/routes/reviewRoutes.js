// src/routes/reviewRoutes.js
import { Router } from 'express';
import {
  listEventReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  listReviewedEventsForAccount
} from '../controllers/reviewController.js';

const router = Router();

/**
 * @route   GET /events/:eventId/reviews
 * @desc    Get all reviews for a specific event
 * @access  Public
 */
router.get('/events/:eventId/reviews', listEventReviews);

/**
 * @route   GET /events/:eventId/reviews/:reviewId
 * @desc    Get a single review by its ID for a specific event
 * @access  Public
 */
router.get('/events/:eventId/reviews/:reviewId', getReview);

/**
 * @route   POST /events/:eventId/reviews
 * @desc    Create a new review for an event
 * @access  Private (requires authentication)
 */
router.post('/events/:eventId/reviews', createReview);

/**
 * @route   PUT /events/:eventId/reviews/:reviewId
 * @desc    Update an existing review
 * @access  Private (requires authentication and ownership)
 */
router.put('/events/:eventId/reviews/:reviewId', updateReview);

/**
 * @route   DELETE /events/:eventId/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (requires authentication and ownership)
 */
router.delete('/events/:eventId/reviews/:reviewId', deleteReview);

/**
 * @route   GET /accounts/:accountId/reviewed-events
 * @desc    Get all events reviewed by a specific account
 * @access  Public
 */
router.get('/accounts/:accountId/reviewed-events', listReviewedEventsForAccount);

export default router;
