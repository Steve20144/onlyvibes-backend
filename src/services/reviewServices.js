const {
  listReviewsByEvent,
  findReview,
  addReviewRecord,
  updateReviewRecord,
  deleteReviewRecord
} = require('../data/reviews');
const { findEventById } = require('../data/events');
const { findAccountById } = require('../data/accounts');
const { validateReviewCreate, validateReviewUpdate, normalizeReviewPayload } = require('../models/review');

const buildError = (status, message, details) => ({ status, message, details });

const ensureEventExists = (eventId) => {
  const event = findEventById(eventId);
  if (!event) {
    throw buildError(404, 'Event not found');
  }

  return event;
};

const ensureUserIsRegistered = (userId) => {
  const account = findAccountById(userId);
  if (!account) {
    throw buildError(404, 'User not found');
  }

  if (account.status !== 'active') {
    throw buildError(403, 'User is not active');
  }

  return account;
};

const ensureReviewOwnership = (review, userId) => {
  if (!userId) {
    throw buildError(400, 'userId is required to modify a review');
  }

  if (review.userId !== userId) {
    throw buildError(403, 'You can only modify your own review');
  }
};

const getReviewsForEvent = (eventId) => {
  ensureEventExists(eventId);
  const reviews = listReviewsByEvent(eventId);
  return {
    eventId,
    total: reviews.length,
    reviews
  };
};

const getReviewById = (eventId, reviewId) => {
  ensureEventExists(eventId);
  const review = findReview(eventId, reviewId);
  if (!review) {
    throw buildError(404, 'Review not found');
  }

  return review;
};

const createReview = (eventId, payload) => {
  ensureEventExists(eventId);
  const validation = validateReviewCreate(payload);
  if (!validation.isValid) {
    throw buildError(400, 'Invalid review payload', validation.errors);
  }

  const normalizedPayload = normalizeReviewPayload(payload);
  ensureUserIsRegistered(normalizedPayload.userId);

  return addReviewRecord({ ...normalizedPayload, eventId });
};

const updateReview = (eventId, reviewId, payload) => {
  ensureEventExists(eventId);
  const validation = validateReviewUpdate(payload);
  if (!validation.isValid) {
    throw buildError(400, 'Invalid review update', validation.errors);
  }

  const review = findReview(eventId, reviewId);
  if (!review) {
    throw buildError(404, 'Review not found');
  }

  ensureReviewOwnership(review, payload.userId);

  const normalizedPayload = normalizeReviewPayload(payload);
  return updateReviewRecord(eventId, reviewId, normalizedPayload);
};

const deleteReview = (eventId, reviewId, payload = {}) => {
  ensureEventExists(eventId);
  const review = findReview(eventId, reviewId);
  if (!review) {
    throw buildError(404, 'Review not found');
  }

  ensureReviewOwnership(review, payload.userId);

  const deleted = deleteReviewRecord(eventId, reviewId);
  if (!deleted) {
    throw buildError(500, 'Review could not be deleted');
  }
};

module.exports = {
  getReviewsForEvent,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
};
