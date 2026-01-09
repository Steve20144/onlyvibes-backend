// src/controllers/reviewController.js
import mongoose from 'mongoose';
import {
  getReviewsByEventIdService,
  getReviewByIdService,
  getReviewByEventAndAccountService,
  createReviewService,
  updateReviewService,
  deleteReviewService,
  getReviewedEventsByAccountService,
  ensureEventExistsService
} from '../services/reviewService.js';

/**
 * Checks if a value is a valid MongoDB ObjectId string.
 * @param {string} value - The value to check.
 * @returns {boolean} True if the value is a valid ObjectId, false otherwise.
 */
const isValidObjectId = (value) =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);

/**
 * Parses and validates a MongoDB ObjectId from a request parameter.
 * @param {string} value - The ObjectId to parse.
 * @param {string} label - A descriptive label for the ObjectId (e.g., 'event id').
 * @returns {string} The validated ObjectId.
 * @throws {Error} If the ObjectId is invalid.
 */
const parseObjectId = (value, label) => {
  if (!isValidObjectId(value)) {
    const err = new Error(`Invalid ${label}`);
    err.statusCode = 400;
    throw err;
  }
  return value;
};

/**
 * Ensures that an event with the given ID exists.
 * @param {string} eventId - The ID of the event to check.
 * @throws {Error} If the event is not found.
 */
const assertEventExists = async (eventId) => {
  const event = await ensureEventExistsService(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  return event;
};

/**
 * Validates a review rating.
 * @param {number} rating - The rating to validate.
 * @throws {Error} If the rating is not a number between 1 and 5.
 */
const validateRating = (rating) => {
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    const err = new Error('Rating must be between 1 and 5');
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Handles the request to list all reviews for a specific event.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A JSON response with the list of reviews.
 */
export const listEventReviews = async (req, res, next) => {
  try {
    const eventId = parseObjectId(req.params.eventId, 'event id');
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
 * Retrieves a single review by its ID for a specific event.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} The review data or an error message.
 */
export const getReview = async (req, res, next) => {
  try {
    const eventId = parseObjectId(req.params.eventId, 'event id');
    const reviewId = parseObjectId(req.params.reviewId, 'review id');
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
 * Handles the creation of a new review for an event.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} The created review data.
 */
export const createReview = async (req, res, next) => {
  try {
    const eventId = parseObjectId(req.params.eventId, 'event id');
    const { accountId, rating, comment, mediaUrls } = req.body;

    await assertEventExists(eventId);

    if (!accountId || typeof accountId !== 'string') {
      const err = new Error('A valid accountId is required');
      err.statusCode = 400;
      throw err;
    }

    validateRating(Number(rating));

    const existingReview = await getReviewByEventAndAccountService(
      eventId,
      accountId
    );
    if (existingReview) {
      const err = new Error('Review already exists for this event and account');
      err.statusCode = 409;
      throw err;
    }

    const review = await createReviewService(eventId, {
      accountId,
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
 * Updates an existing review by its ID.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} The updated review data.
 */
export const updateReview = async (req, res, next) => {
  try {
    const eventId = parseObjectId(req.params.eventId, 'event id');
    const reviewId = parseObjectId(req.params.reviewId, 'review id');
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
 * Deletes a review by its ID.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A confirmation message.
 */
export const deleteReview = async (req, res, next) => {
  try {
    const eventId = parseObjectId(req.params.eventId, 'event id');
    const reviewId = parseObjectId(req.params.reviewId, 'review id');

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
 * Retrieves a list of events that a user has reviewed.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A list of reviewed events.
 */
export const listReviewedEventsForAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    if (!accountId) {
      const err = new Error('accountId parameter is required');
      err.statusCode = 400;
      throw err;
    }

    const reviewedEvents = await getReviewedEventsByAccountService(accountId);

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
