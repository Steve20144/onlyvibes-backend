// src/controllers/reviewController.js
import {
  getReviewsByEventIdService,
  getReviewByIdService,
  getReviewByEventAndUserService,
  createReviewService,
  updateReviewService,
  deleteReviewService,
  getReviewedEventsByUserService,
  ensureEventExistsService
} from '../services/reviewService.js';

const parseEventId = (value) => {
  const eventId = Number(value);
  if (Number.isNaN(eventId)) {
    const err = new Error('Invalid event id');
    err.statusCode = 400;
    throw err;
  }
  return eventId;
};

const parseReviewId = (value) => {
  const reviewId = Number(value);
  if (Number.isNaN(reviewId)) {
    const err = new Error('Invalid review id');
    err.statusCode = 400;
    throw err;
  }
  return reviewId;
};

const assertEventExists = async (eventId) => {
  const event = await ensureEventExistsService(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  return event;
};

const validateRating = (rating) => {
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    const err = new Error('Rating must be between 1 and 5');
    err.statusCode = 400;
    throw err;
  }
};

/**
 * GET /events/:eventId/reviews
 */
export const listEventReviews = async (req, res, next) => {
  try {
    const eventId = parseEventId(req.params.eventId);
    await assertEventExists(eventId);
    const reviews = await getReviewsByEventIdService(eventId);

    return res.status(200).json({
      success: true,
      data: reviews,
      error: null,
      message:
        reviews.length === 0
          ? 'No reviews have been submitted for this event yet'
          : 'Reviews retrieved'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /events/:eventId/reviews/:reviewId
 */
export const getReview = async (req, res, next) => {
  try {
    const eventId = parseEventId(req.params.eventId);
    const reviewId = parseReviewId(req.params.reviewId);
    await assertEventExists(eventId);

    const review = await getReviewByIdService(eventId, reviewId);
    if (!review) {
      const err = new Error('Review not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: review,
      error: null,
      message: 'Review retrieved'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /events/:eventId/reviews
 */
export const createReview = async (req, res, next) => {
  try {
    const eventId = parseEventId(req.params.eventId);
    const { userId, rating, comment, mediaUrls } = req.body;

    await assertEventExists(eventId);

    if (!userId || typeof userId !== 'string') {
      const err = new Error('A valid userId is required');
      err.statusCode = 400;
      throw err;
    }

    validateRating(Number(rating));

    const existingReview = await getReviewByEventAndUserService(eventId, userId);
    if (existingReview) {
      const err = new Error('Review already exists for this event and user');
      err.statusCode = 409;
      throw err;
    }

    const review = await createReviewService(eventId, {
      userId,
      rating: Number(rating),
      comment,
      mediaUrls
    });

    return res.status(201).json({
      success: true,
      data: review,
      error: null,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /events/:eventId/reviews/:reviewId
 */
export const updateReview = async (req, res, next) => {
  try {
    const eventId = parseEventId(req.params.eventId);
    const reviewId = parseReviewId(req.params.reviewId);
    const { rating, comment, mediaUrls } = req.body;

    await assertEventExists(eventId);

    if (rating !== undefined) {
      validateRating(Number(rating));
    }

    const updated = await updateReviewService(eventId, reviewId, {
      rating: rating !== undefined ? Number(rating) : undefined,
      comment,
      mediaUrls
    });

    if (!updated) {
      const err = new Error('Review not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: updated,
      error: null,
      message: 'Review updated successfully'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /events/:eventId/reviews/:reviewId
 */
export const deleteReview = async (req, res, next) => {
  try {
    const eventId = parseEventId(req.params.eventId);
    const reviewId = parseReviewId(req.params.reviewId);

    await assertEventExists(eventId);

    const deleted = await deleteReviewService(eventId, reviewId);
    if (!deleted) {
      const err = new Error('Review not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: null,
      error: null,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /users/:userId/reviewed-events
 */
export const listReviewedEventsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      const err = new Error('userId parameter is required');
      err.statusCode = 400;
      throw err;
    }

    const reviewedEvents = await getReviewedEventsByUserService(userId);

    return res.status(200).json({
      success: true,
      data: reviewedEvents,
      error: null,
      message:
        reviewedEvents.length === 0
          ? 'User has not reviewed any events yet'
          : 'Reviewed events retrieved'
    });
  } catch (error) {
    return next(error);
  }
};
