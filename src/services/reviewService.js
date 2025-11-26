// src/services/reviewService.js
import mongoose from 'mongoose';
import Review from '../models/review.js';
import Event from '../models/event.js';

const isDbConnected = () => mongoose.connection.readyState === 1;

const normalizeReviewDoc = (doc) => {
  if (!doc) return null;

  const obj = doc.toObject ? doc.toObject() : doc;

  if (obj._id) {
    obj.id = obj._id.toString();
    obj.reviewId = obj.id; // backward compatibility for existing clients/tests
    delete obj._id;
  }

  if (obj.eventId) {
    obj.eventId = obj.eventId.toString();
  }

  delete obj.__v;
  return obj;
};

export const ensureEventExistsService = async (eventId) => {
  if (!isDbConnected()) return null;
  const doc = await Event.findById(eventId).select('title location dateTime');
  return doc ? doc.toObject() : null;
};

export const getReviewsByEventIdService = async (eventId) => {
  if (!isDbConnected()) return [];
  const docs = await Review.find({ eventId }).sort({ createdAt: -1 });
  return docs.map(normalizeReviewDoc);
};

export const getReviewByIdService = async (eventId, reviewId) => {
  if (!isDbConnected()) return null;
  const doc = await Review.findOne({ _id: reviewId, eventId });
  return normalizeReviewDoc(doc);
};

export const getReviewByEventAndAccountService = async (eventId, accountId) => {
  if (!isDbConnected()) return null;
  const doc = await Review.findOne({ eventId, accountId });
  return normalizeReviewDoc(doc);
};

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

export const deleteReviewService = async (eventId, reviewId) => {
  if (!isDbConnected()) return false;

  const doc = await Review.findOneAndDelete({ _id: reviewId, eventId });
  return !!doc;
};

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
