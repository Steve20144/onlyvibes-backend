// src/routes/reviewRoutes.js
import { Router } from 'express';
import {
  listEventReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  listReviewedEventsForUser
} from '../controllers/reviewController.js';

const router = Router();

// Event review endpoints
router.get('/events/:eventId/reviews', listEventReviews);
router.get('/events/:eventId/reviews/:reviewId', getReview);
router.post('/events/:eventId/reviews', createReview);
router.put('/events/:eventId/reviews/:reviewId', updateReview);
router.delete('/events/:eventId/reviews/:reviewId', deleteReview);

// Reviewed events by user
router.get('/users/:userId/reviewed-events', listReviewedEventsForUser);

export default router;
