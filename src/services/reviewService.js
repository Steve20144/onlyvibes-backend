// src/services/reviewService.js
import Review from '../models/review.js';
import Event from '../models/event.js';
import { isDbConnected } from '../utils/dbHealth.js';

/**
 * Normalizes a Mongoose review document into a plain JavaScript object.
 * It converts `_id` to `id` and `reviewId`, and ensures `eventId` is a string.
 * @param {object} doc - The Mongoose document to normalize.
 * @returns {object|null} The normalized object, or null if the input is falsy.
 */
const normalizeReviewDoc = (doc) => {
  if (!doc) return null;

  const obj = doc.toObject ? doc.toObject() : doc;

  if (obj._id) {
    obj.id = obj._id.toString();
    obj.reviewId = obj.id; // For backward compatibility.
    delete obj._id;
  }

  if (obj.eventId) {
    obj.eventId = obj.eventId.toString();
  }

  delete obj.__v;
  return obj;
};

/**
 * Checks if an event exists in the database.
 * @async
 * @param {string} eventId - The ID of the event to check.
 * @returns {Promise<object|null>} A promise that resolves to the event object if found, otherwise null.
 */
export const ensureEventExistsService = async (eventId) => {
  if (!isDbConnected()) return null;
  const doc = await Event.findById(eventId).select('title location dateTime');
  return doc ? doc.toObject() : null;
};

/**
 * Retrieves all reviews for a specific event, sorted by creation date.
 * @async
 * @param {string} eventId - The ID of the event.
 * @returns {Promise<object[]>} A promise that resolves to an array of review objects.
 */
export const getReviewsByEventIdService = async (eventId) => {
  if (!isDbConnected()) return [];
  const docs = await Review.find({ eventId }).sort({ createdAt: -1 });
  return docs.map(normalizeReviewDoc);
};

/**
 * Retrieves a single review by its ID and the event ID it belongs to.
 * @async
 * @param {string} eventId - The ID of the event.
 * @param {string} reviewId - The ID of the review.
 * @returns {Promise<object|null>} A promise that resolves to the review object, or null if not found.
 */
export const getReviewByIdService = async (eventId, reviewId) => {
  if (!isDbConnected()) return null;
  const doc = await Review.findOne({ _id: reviewId, eventId });
  return normalizeReviewDoc(doc);
};

/**
 * Retrieves a review for a specific event and account.
 * @async
 * @param {string} eventId - The ID of the event.
 * @param {string} accountId - The ID of the account.
 * @returns {Promise<object|null>} A promise that resolves to the review object, or null if not found.
 */
export const getReviewByEventAndAccountService = async (eventId, accountId) => {
  if (!isDbConnected()) return null;
  const doc = await Review.findOne({ eventId, accountId });
  return normalizeReviewDoc(doc);
};

/**
 * Creates a new review for an event.
 * @async
 * @param {string} eventId - The ID of the event being reviewed.
 * @param {object} payload - The data for the new review.
 * @returns {Promise<object>} A promise that resolves to the newly created review object.
 */
export const createReviewService = async (eventId, payload) => {
  if (!isDbConnected()) {
    throw new Error('Database not available');
  }

  const doc = await Review.create({
    eventId,
    accountId: payload.accountId,
    rating: payload.rating,
    comment: payload.comment || '',
    mediaUrls: Array.isArray(payload.mediaUrls) ? payload.mediaUrls : []
  });

  return normalizeReviewDoc(doc);
};

/**
 * Updates an existing review.
 * @async
 * @param {string} eventId - The ID of the event the review belongs to.
 * @param {string} reviewId - The ID of the review to update.
 * @param {object} updates - An object containing the fields to update.
 * @returns {Promise<object|null>} A promise that resolves to the updated review object, or null if not found.
 */
export const updateReviewService = async (eventId, reviewId, updates) => {
  if (!isDbConnected()) return null;

  const prepared = { ...updates };
  if (updates.rating !== undefined) {
    prepared.rating = updates.rating;
  }
  if (updates.comment !== undefined) {
    prepared.comment = updates.comment;
  }
  if (Array.isArray(updates.mediaUrls)) {
    prepared.mediaUrls = updates.mediaUrls;
  }

  const doc = await Review.findOneAndUpdate(
    { _id: reviewId, eventId },
    prepared,
    { new: true }
  );

  return normalizeReviewDoc(doc);
};

/**
 * Deletes a review by its ID and the event ID it belongs to.
 * @async
 * @param {string} eventId - The ID of the event.
 * @param {string} reviewId - The ID of the review to delete.
 * @returns {Promise<boolean>} A promise that resolves to true if deletion was successful, false otherwise.
 */
export const deleteReviewService = async (eventId, reviewId) => {
  if (!isDbConnected()) return false;

  const doc = await Review.findOneAndDelete({ _id: reviewId, eventId });
  return !!doc;
};

/**
 * Retrieves a summary of events that have been reviewed by a specific account.
 * @async
 * @param {string} accountId - The ID of the account.
 * @returns {Promise<object[]>} A promise that resolves to an array of event review summaries.
 */
export const getReviewedEventsByAccountService = async (accountId) => {
  if (!isDbConnected()) return [];

  const reviewDocs = await Review.find({ accountId }).sort({ updatedAt: -1 });
  if (!reviewDocs.length) return [];

  const reviews = reviewDocs.map(normalizeReviewDoc);
  const eventIds = [...new Set(reviews.map((r) => r.eventId))];
  const eventDocs = await Event.find({ _id: { $in: eventIds } })
    .select('title location')
    .lean();

  const eventMap = new Map(
    eventDocs.map((event) => [event._id.toString(), event])
  );

  const summaries = [];
  const grouped = new Map();

  reviews.forEach((review) => {
    if (!grouped.has(review.eventId)) {
      grouped.set(review.eventId, []);
    }
    grouped.get(review.eventId).push(review);
  });

  grouped.forEach((list, eventId) => {
    const event = eventMap.get(eventId);
    const totalRating = list.reduce((sum, item) => sum + Number(item.rating), 0);
    const lastReview = list.reduce((latest, item) =>
      new Date(item.updatedAt) > new Date(latest.updatedAt) ? item : latest
    );

    summaries.push({
      eventId,
      eventTitle: event?.title || 'Unknown event',
      location: event?.location || 'Unknown location',
      totalReviews: list.length,
      averageRating: Number((totalRating / list.length).toFixed(1)),
      reviewId: lastReview.id,
      lastReviewedAt: lastReview.updatedAt,
      lastComment: lastReview.comment
    });
  });

  return summaries;
};
