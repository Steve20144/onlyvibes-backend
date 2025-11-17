import {
  listEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  likeEvent,
  unlikeEvent,
  getLikesCount,
  listReviews,
  createReview,
  getReviewById,
  updateReview,
  deleteReview
} from '../services/eventService.js';
import { sendSuccess } from '../utils/responses.js';

/**
 * Returns paginated events.
 */
export const listEventsController = async (req, res, next) => {
  try {
    const events = await listEvents(req.query);
    return sendSuccess(res, { data: events });
  } catch (error) {
    return next(error);
  }
};

/**
 * Creates event.
 */
export const createEventController = async (req, res, next) => {
  try {
    const event = await createEvent(req.body);
    return sendSuccess(res, { statusCode: 201, data: event, message: 'Event created successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Gets event by id.
 */
export const getEventController = async (req, res, next) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!event) {
      return sendSuccess(res, { statusCode: 404, message: 'Event not found' });
    }

    return sendSuccess(res, { data: event });
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates event.
 */
export const updateEventController = async (req, res, next) => {
  try {
    const event = await updateEvent(req.params.eventId, req.body);
    if (!event) {
      return sendSuccess(res, { statusCode: 404, message: 'Event not found' });
    }

    return sendSuccess(res, { data: event, message: 'Event updated successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes event.
 */
export const deleteEventController = async (req, res, next) => {
  try {
    const deleted = await deleteEvent(req.params.eventId);
    if (!deleted) {
      return sendSuccess(res, { statusCode: 404, message: 'Event not found' });
    }

    return sendSuccess(res, { statusCode: 204, data: null, message: 'Event deleted' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Likes event.
 */
export const likeEventController = async (req, res, next) => {
  try {
    const event = await likeEvent(req.params.eventId);
    if (!event) {
      return sendSuccess(res, { statusCode: 404, message: 'Event not found' });
    }

    return sendSuccess(res, { data: { likes: event.likes }, message: 'Event liked' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Unlikes event.
 */
export const unlikeEventController = async (req, res, next) => {
  try {
    const event = await unlikeEvent(req.params.eventId);
    if (!event) {
      return sendSuccess(res, { statusCode: 404, message: 'Event not found' });
    }

    return sendSuccess(res, { data: { likes: event.likes }, message: 'Event unliked' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns total likes.
 */
export const getLikesController = async (req, res, next) => {
  try {
    const likes = await getLikesCount(req.params.eventId);
    return sendSuccess(res, { data: { likes } });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lists reviews for event.
 */
export const listReviewsController = async (req, res, next) => {
  try {
    const reviews = await listReviews(req.params.eventId);
    return sendSuccess(res, { data: reviews });
  } catch (error) {
    return next(error);
  }
};

/**
 * Creates review.
 */
export const createReviewController = async (req, res, next) => {
  try {
    const { userId, rating, comment, mediaUrls } = req.body;
    const review = await createReview(req.params.eventId, { userId, rating, comment, mediaUrls });
    return sendSuccess(res, { statusCode: 201, data: review, message: 'Review created' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Gets review.
 */
export const getReviewController = async (req, res, next) => {
  try {
    const review = await getReviewById(req.params.reviewId);
    if (!review) {
      return sendSuccess(res, { statusCode: 404, message: 'Review not found' });
    }

    return sendSuccess(res, { data: review });
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates review.
 */
export const updateReviewController = async (req, res, next) => {
  try {
    const review = await updateReview(req.params.reviewId, req.body);
    if (!review) {
      return sendSuccess(res, { statusCode: 404, message: 'Review not found' });
    }

    return sendSuccess(res, { data: review, message: 'Review updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes review.
 */
export const deleteReviewController = async (req, res, next) => {
  try {
    const deleted = await deleteReview(req.params.reviewId);
    if (!deleted) {
      return sendSuccess(res, { statusCode: 404, message: 'Review not found' });
    }

    return sendSuccess(res, { statusCode: 204, data: null, message: 'Review removed' });
  } catch (error) {
    return next(error);
  }
};
