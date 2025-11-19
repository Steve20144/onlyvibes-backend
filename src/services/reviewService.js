// src/services/reviewService.js
import mongoose from 'mongoose';
import Review from '../models/Review.js';   // <- adjust path/name if needed
import Event from '../models/Event.js';     // <- used when DB is available

import { reviews, getNextReviewId } from '../data/reviews.js';
import { events } from '../data/events.js';

/**
 * Check if MongoDB is connected.
 * @returns {boolean}
 */
const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Normalize a Mongoose document to a plain JS object and ensure `id` field exists.
 * @param {object} doc
 * @returns {object|null}
 */
const normalizeReviewDoc = (doc) => {
  if (!doc) return null;

  const obj = doc.toObject ? doc.toObject() : doc;

  if (obj._id && !obj.id) {
    obj.id = obj._id.toString();
  }

  delete obj.__v;

  return obj;
};

/**
 * Ensure an event exists for a given eventId (mock fallback).
 * @param {number} eventId
 * @returns {object|null}
 */
const findEventMock = (eventId) =>
  events.find((event) => event.eventId === eventId) || null;

/**
 * Fetch all reviews for a specific event.
 * Tries MongoDB first; falls back to mock data.
 * @param {number} eventId
 * @returns {Promise<object[]>}
 */
export const getReviewsByEventIdService = async (eventId) => {
  if (isDbConnected()) {
    try {
      const docs = await Review.find({ eventId });
      return docs.map(normalizeReviewDoc);
    } catch (error) {
      console.error('getReviewsByEventIdService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  return reviews.filter((review) => review.eventId === eventId);
};

/**
 * Fetch a single review by ids.
 * Tries MongoDB first; falls back to mock data.
 * @param {number} eventId
 * @param {number} reviewId
 * @returns {Promise<object|null>}
 */
export const getReviewByIdService = async (eventId, reviewId) => {
  if (isDbConnected()) {
    try {
      const doc = await Review.findOne({ eventId, reviewId });
      return normalizeReviewDoc(doc);
    } catch (error) {
      console.error('getReviewByIdService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  return (
    reviews.find(
      (review) => review.eventId === eventId && review.reviewId === reviewId
    ) || null
  );
};

/**
 * Check whether a user already reviewed an event.
 * Tries MongoDB first; falls back to mock data.
 * @param {number} eventId
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export const getReviewByEventAndUserService = async (eventId, userId) => {
  if (isDbConnected()) {
    try {
      const doc = await Review.findOne({ eventId, userId });
      return normalizeReviewDoc(doc);
    } catch (error) {
      console.error(
        'getReviewByEventAndUserService: MongoDB error, falling back to mock:',
        error.message
      );
    }
  }

  // Fallback: mock data
  return (
    reviews.find(
      (review) => review.eventId === eventId && review.userId === userId
    ) || null
  );
};

/**
 * Create a new review for an event.
 * Tries MongoDB first; falls back to mock data.
 * @param {number} eventId
 * @param {{userId:string,rating:number,comment?:string,mediaUrls?:string[]}} payload
 * @returns {Promise<object>}
 */
export const createReviewService = async (eventId, payload) => {
  const now = new Date();

  const baseReview = {
    reviewId: getNextReviewId(), // use the same ID generator for DB + mock
    eventId,
    userId: payload.userId,
    rating: payload.rating,
    comment: payload.comment || '',
    mediaUrls: Array.isArray(payload.mediaUrls) ? payload.mediaUrls : [],
    createdAt: now,
    updatedAt: now
  };

  if (isDbConnected()) {
    try {
      const doc = await Review.create(baseReview);
      return normalizeReviewDoc(doc);
    } catch (error) {
      console.error('createReviewService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  reviews.push(baseReview);
  return baseReview;
};

/**
 * Update an existing review.
 * Tries MongoDB first; falls back to mock data.
 * @param {number} eventId
 * @param {number} reviewId
 * @param {{rating?:number,comment?:string,mediaUrls?:string[]}} updates
 * @returns {Promise<object|null>}
 */
export const updateReviewService = async (eventId, reviewId, updates) => {
  const updatesToApply = {
    ...updates,
    updatedAt: new Date()
  };

  if (Array.isArray(updates.mediaUrls)) {
    updatesToApply.mediaUrls = updates.mediaUrls;
  }

  if (isDbConnected()) {
    try {
      const doc = await Review.findOneAndUpdate(
        { eventId, reviewId },
        updatesToApply,
        { new: true }
      );

      return normalizeReviewDoc(doc);
    } catch (error) {
      console.error('updateReviewService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
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
 * Tries MongoDB first; falls back to mock data.
 * @param {number} eventId
 * @param {number} reviewId
 * @returns {Promise<boolean>}
 */
export const deleteReviewService = async (eventId, reviewId) => {
  if (isDbConnected()) {
    try {
      const result = await Review.findOneAndDelete({ eventId, reviewId });
      return !!result;
    } catch (error) {
      console.error('deleteReviewService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  const index = reviews.findIndex(
    (review) => review.eventId === eventId && review.reviewId === reviewId
  );

  if (index === -1) return false;

  reviews.splice(index, 1);
  return true;
};

/**
 * Retrieve a summary of events reviewed by a user.
 * Tries MongoDB first; falls back to mock data.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export const getReviewedEventsByUserService = async (userId) => {
  if (isDbConnected()) {
    try {
      const userReviewsDocs = await Review.find({ userId });

      if (!userReviewsDocs.length) return [];

      const userReviews = userReviewsDocs.map(normalizeReviewDoc);

      const eventMap = new Map();

      userReviews.forEach((review) => {
        if (!eventMap.has(review.eventId)) {
          eventMap.set(review.eventId, []);
        }
        eventMap.get(review.eventId).push(review);
      });

      const eventIds = [...eventMap.keys()];

      const eventDocs = await Event.find({ eventId: { $in: eventIds } });
      const dbEventMap = new Map();
      eventDocs.forEach((event) => {
        const obj = event.toObject ? event.toObject() : event;
        dbEventMap.set(obj.eventId, obj);
      });

      const summaries = [];

      eventMap.forEach((reviewList, eventId) => {
        const event = dbEventMap.get(eventId);
        const totalRating = reviewList.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0
        );
        const latestReview = reviewList.reduce((latest, review) =>
          new Date(latest.updatedAt) > new Date(review.updatedAt)
            ? latest
            : review
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
    } catch (error) {
      console.error(
        'getReviewedEventsByUserService: MongoDB error, falling back to mock:',
        error.message
      );
    }
  }

  // Fallback: mock implementation
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
    const event = findEventMock(eventId);
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
 * Tries MongoDB first; falls back to mock events.
 * @param {number} eventId
 * @returns {Promise<object|null>}
 */
export const ensureEventExistsService = async (eventId) => {
  if (isDbConnected()) {
    try {
      const eventDoc = await Event.findOne({ eventId });
      if (!eventDoc) return null;
      const obj = eventDoc.toObject ? eventDoc.toObject() : eventDoc;
      return obj;
    } catch (error) {
      console.error(
        'ensureEventExistsService: MongoDB error, falling back to mock:',
        error.message
      );
    }
  }

  return findEventMock(eventId);
};
