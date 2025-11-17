import { isDatabaseConnected } from '../config/database.js';
import { EventModel } from '../models/Event.js';
import { ReviewModel } from '../models/Review.js';
import { mockDb, addMockItem, updateMockItem, deleteMockItem } from '../data/mockData.js';
import { paginate, filterBySearchTerm, sortByField } from '../utils/helpers.js';

const useDatabase = () => isDatabaseConnected();

/**
 * Retrieves events with optional filters.
 * @param {object} filters
 */
export const listEvents = async (filters = {}) => {
  if (useDatabase()) {
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.location) query['location.city'] = filters.location;
    if (filters.fromDate || filters.toDate) {
      query.dateTime = {};
      if (filters.fromDate) query.dateTime.$gte = new Date(filters.fromDate);
      if (filters.toDate) query.dateTime.$lte = new Date(filters.toDate);
    }

    const sortField = filters.sortBy || 'dateTime';
    const direction = filters.sortDirection === 'desc' ? -1 : 1;
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.pageSize) || 10;

    const [items, count] = await Promise.all([
      EventModel.find(query)
        .sort({ [sortField]: direction })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      EventModel.countDocuments(query)
    ]);

    return {
      results: items,
      pagination: {
        page,
        pageSize,
        totalItems: count,
        totalPages: Math.ceil(count / pageSize) || 1
      }
    };
  }

  let events = [...mockDb.events];

  if (filters.category) {
    events = events.filter((event) => event.category === filters.category);
  }
  if (filters.location) {
    events = events.filter((event) => event.location?.city === filters.location);
  }
  if (filters.term) {
    events = filterBySearchTerm(events, filters.term);
  }
  if (filters.sortBy) {
    events = sortByField(events, filters.sortBy, filters.sortDirection);
  }

  return paginate(events, { page: filters.page, pageSize: filters.pageSize });
};

/**
 * Creates a new event.
 * @param {object} payload
 */
export const createEvent = async (payload) => {
  if (useDatabase()) {
    const created = await EventModel.create(payload);
    return created.toObject();
  }

  return addMockItem('events', payload);
};

/**
 * Fetches a single event.
 * @param {string} eventId
 */
export const getEventById = async (eventId) => {
  if (useDatabase()) {
    return EventModel.findById(eventId).lean();
  }

  return mockDb.events.find((event) => event.id === eventId) || null;
};

/**
 * Updates event data.
 * @param {string} eventId
 * @param {object} updates
 */
export const updateEvent = async (eventId, updates) => {
  if (useDatabase()) {
    return EventModel.findByIdAndUpdate(eventId, updates, { new: true }).lean();
  }

  return updateMockItem('events', eventId, updates);
};

/**
 * Deletes an event by id.
 * @param {string} eventId
 */
export const deleteEvent = async (eventId) => {
  if (useDatabase()) {
    const deleted = await EventModel.findByIdAndDelete(eventId);
    return Boolean(deleted);
  }

  return deleteMockItem('events', eventId);
};

/**
 * Increments like counter.
 * @param {string} eventId
 */
export const likeEvent = async (eventId) => {
  if (useDatabase()) {
    return EventModel.findByIdAndUpdate(eventId, { $inc: { likes: 1 } }, { new: true }).lean();
  }

  const event = mockDb.events.find((item) => item.id === eventId);
  if (!event) return null;
  event.likes = (event.likes || 0) + 1;
  return event;
};

/**
 * Decrements like counter.
 * @param {string} eventId
 */
export const unlikeEvent = async (eventId) => {
  if (useDatabase()) {
    return EventModel.findByIdAndUpdate(eventId, { $inc: { likes: -1 } }, { new: true }).lean();
  }

  const event = mockDb.events.find((item) => item.id === eventId);
  if (!event) return null;
  event.likes = Math.max((event.likes || 1) - 1, 0);
  return event;
};

/**
 * Returns like count for event.
 * @param {string} eventId
 */
export const getLikesCount = async (eventId) => {
  const event = await getEventById(eventId);
  return event ? event.likes || 0 : 0;
};

/**
 * Lists reviews for event.
 * @param {string} eventId
 */
export const listReviews = async (eventId) => {
  if (useDatabase()) {
    return ReviewModel.find({ eventId }).lean();
  }

  return mockDb.reviews.filter((review) => review.eventId === eventId);
};

/**
 * Creates a review entry.
 * @param {string} eventId
 * @param {object} payload
 */
export const createReview = async (eventId, payload) => {
  if (useDatabase()) {
    const created = await ReviewModel.create({ eventId, ...payload });
    return created.toObject();
  }

  return addMockItem('reviews', { eventId, ...payload });
};

/**
 * Fetches a single review.
 * @param {string} reviewId
 */
export const getReviewById = async (reviewId) => {
  if (useDatabase()) {
    return ReviewModel.findById(reviewId).lean();
  }

  return mockDb.reviews.find((review) => review.id === reviewId) || null;
};

/**
 * Updates a review.
 * @param {string} reviewId
 * @param {object} updates
 */
export const updateReview = async (reviewId, updates) => {
  if (useDatabase()) {
    return ReviewModel.findByIdAndUpdate(reviewId, updates, { new: true }).lean();
  }

  return updateMockItem('reviews', reviewId, updates);
};

/**
 * Deletes a review.
 * @param {string} reviewId
 */
export const deleteReview = async (reviewId) => {
  if (useDatabase()) {
    const deleted = await ReviewModel.findByIdAndDelete(reviewId);
    return Boolean(deleted);
  }

  return deleteMockItem('reviews', reviewId);
};
