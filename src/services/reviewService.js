// src/services/reviewService.js
import { reviews, getNextReviewId } from '../data/reviews.js';
import { events } from '../data/events.js';

/**
 * Ensure an event exists for a given eventId.
 * @param {number} eventId
 * @returns {object|null}
 */
const findEvent = (eventId) => events.find((event) => event.eventId === eventId) || null;

/**
 * Fetch all reviews for a specific event.
 * @param {number} eventId
 * @returns {Promise<object[]>}
 */
export const getReviewsByEventIdService = async (eventId) =>
  reviews.filter((review) => review.eventId === eventId);

/**
 * Fetch a single review by ids.
 * @param {number} eventId
 * @param {number} reviewId
 * @returns {Promise<object|null>}
 */
export const getReviewByIdService = async (eventId, reviewId) =>
  reviews.find((review) => review.eventId === eventId && review.reviewId === reviewId) || null;

/**
 * Check whether a user already reviewed an event.
 * @param {number} eventId
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export const getReviewByEventAndUserService = async (eventId, userId) =>
  reviews.find((review) => review.eventId === eventId && review.userId === userId) || null;

/**
 * Create a new review for an event.
 * @param {number} eventId
 * @param {{userId:string,rating:number,comment?:string,mediaUrls?:string[]}} payload
 * @returns {Promise<object>}
 */
export const createReviewService = async (eventId, payload) => {
  const now = new Date();

  const newReview = {
    reviewId: getNextReviewId(),
    eventId,
    userId: payload.userId,
    rating: payload.rating,
    comment: payload.comment || '',
    mediaUrls: Array.isArray(payload.mediaUrls) ? payload.mediaUrls : [],
    createdAt: now,
    updatedAt: now
  };

  reviews.push(newReview);
  return newReview;
};

/**
 * Update an existing review.
 * @param {number} eventId
 * @param {number} reviewId
 * @param {{rating?:number,comment?:string,mediaUrls?:string[]}} updates
 * @returns {Promise<object|null>}
 */
export const updateReviewService = async (eventId, reviewId, updates) => {
  const index = reviews.findIndex(
    (review) => review.eventId === eventId && review.reviewId === reviewId
  );

  if (index === -1) return null;

  const updatedReview = {
    ...reviews[index],
    ...updates,
    mediaUrls: Array.isArray(updates.mediaUrls)
      ? updates.mediaUrls
      : reviews[index].mediaUrls,
    updatedAt: new Date()
  };

  reviews[index] = updatedReview;
  return updatedReview;
};

/**
 * Delete a review.
 * @param {number} eventId
 * @param {number} reviewId
 * @returns {Promise<boolean>}
 */
export const deleteReviewService = async (eventId, reviewId) => {
  const index = reviews.findIndex(
    (review) => review.eventId === eventId && review.reviewId === reviewId
  );

  if (index === -1) return false;

  reviews.splice(index, 1);
  return true;
};

/**
 * Retrieve a summary of events reviewed by a user.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export const getReviewedEventsByUserService = async (userId) => {
  const userReviews = reviews.filter((review) => review.userId === userId);
  if (userReviews.length === 0) return [];

  const eventMap = new Map();

  userReviews.forEach((review) => {
    if (!eventMap.has(review.eventId)) {
      eventMap.set(review.eventId, []);
    }
    eventMap.get(review.eventId).push(review);
  });

  const summaries = [];

  eventMap.forEach((reviewList, eventId) => {
    const event = findEvent(eventId);
    const totalRating = reviewList.reduce((sum, review) => sum + review.rating, 0);
    const latestReview = reviewList.reduce((latest, review) =>
      latest.updatedAt > review.updatedAt ? latest : review
    );

    summaries.push({
      eventId,
      eventTitle: event?.title || 'Unknown event',
      location: event?.location || 'Unknown location',
      totalReviews: reviewList.length,
      averageRating: Number((totalRating / reviewList.length).toFixed(1)),
      lastReviewedAt: latestReview.updatedAt,
      lastComment: latestReview.comment
    });
  });

  return summaries;
};

/**
 * Utility to verify an event exists via the service layer.
 * @param {number} eventId
 * @returns {Promise<object|null>}
 */
export const ensureEventExistsService = async (eventId) => findEvent(eventId);
