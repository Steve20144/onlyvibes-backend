// src/services/eventService.js
import mongoose from 'mongoose';
import Event from '../models/event.js';

const logEventServiceDebug = (...args) => {
  if (process.env.DEBUG_EVENTS === 'true' || process.env.DEBUG === 'true') {
    console.log('[EVENT_SERVICE]', ...args);
  }
};

const logEventServiceError = (...args) => {
  console.error('[EVENT_SERVICE]', ...args);
};

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
const normalizeEventDoc = (doc) => {
  if (!doc) return null;

  const obj = doc.toObject ? doc.toObject() : doc;

  if (obj._id && !obj.id) {
    obj.id = obj._id.toString();
  }

  delete obj.__v;

  return obj;
};

/**
 * Helper: normalize category/category-style payloads
 * Accepts:
 *  - category: "Music"
 *  - category: ["Music", "Techno"]
 *  - categories: "Music,Techno"
 *  - categories: ["Music", "Techno"]
 */
const normalizeCategoryInput = (payload) => {
  let category = payload.category ?? payload.categories;

  if (typeof category === 'string') {
    category = category
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  } else if (Array.isArray(category)) {
    category = category
      .map((c) => (typeof c === 'string' ? c.trim() : c))
      .filter(Boolean);
  }

  return category;
};

/**
 * List events with optional filters.
 * @async
 * @param {{category?:string,location?:string}} filters
 * @returns {Promise<object[]>}
 */
export const listEventsService = async (filters = {}) => {
  const { category, location } = filters;

  if (!isDbConnected()) {
    logEventServiceDebug('listEventsService: MongoDB not connected.', { filters });
    return [];
  }

  try {
    const query = {};

    if (category) {
      // Match events where `category` array contains this category
      query.category = category;
    }

    if (location) {
      // Case-insensitive substring match on location
      query.location = new RegExp(location, 'i');
    }

    logEventServiceDebug('listEventsService: querying events', { query });

    const docs = await Event.find(query).sort({ dateTime: 1 });
    const result = docs.map(normalizeEventDoc);

    logEventServiceDebug('listEventsService: result count', { count: result.length });

    return result;
  } catch (err) {
    logEventServiceError('listEventsService FAILED', err);
    throw err;
  }
};

/**
 * Get one event by Mongo _id (string).
 * @async
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export const getEventByIdService = async (id) => {
  if (!isDbConnected()) {
    logEventServiceDebug('getEventByIdService: MongoDB not connected.', { id });
    return null;
  }

  try {
    logEventServiceDebug('getEventByIdService: fetching event', { id });
    const doc = await Event.findById(id);
    const normalized = normalizeEventDoc(doc);

    if (!normalized) {
      logEventServiceDebug('getEventByIdService: event not found', { id });
    }

    return normalized;
  } catch (err) {
    logEventServiceError('getEventByIdService FAILED', err);
    throw err;
  }
};

/**
 * Create a new event.
 * @async
 * @param {object} payload
 * @param {string} payload.creatorId
 * @param {string} payload.title
 * @param {string} [payload.description]
 * @param {string} payload.location
 * @param {string|Date} payload.dateTime
 * @param {string|string[]} [payload.category]
 * @param {string|string[]} [payload.categories] // legacy / frontend confusion
 * @param {string} [payload.imageUrl]
 * @returns {Promise<object>}
 */
export const createEventService = async (payload) => {
  if (!isDbConnected()) {
    logEventServiceError('createEventService: MongoDB not connected.');
    throw new Error('Database not available');
  }

  try {
    const category = normalizeCategoryInput(payload);

    const baseData = {
      creatorId: payload.creatorId,
      title: payload.title,
      description: payload.description || '',
      location: payload.location,
      dateTime: new Date(payload.dateTime),
      category,
      imageUrl: payload.imageUrl || undefined
    };

    logEventServiceDebug('createEventService: creating event', {
      creatorId: baseData.creatorId?.toString?.() || baseData.creatorId,
      title: baseData.title,
      location: baseData.location,
      category: baseData.category
    });

    const doc = await Event.create(baseData);
    const normalized = normalizeEventDoc(doc);

    logEventServiceDebug('createEventService: event created', {
      id: normalized?.id,
      title: normalized?.title
    });

    return normalized;
  } catch (err) {
    logEventServiceError('createEventService FAILED', err);
    throw err;
  }
};

/**
 * Update an existing event.
 * @async
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
export const updateEventService = async (id, updates) => {
  if (!isDbConnected()) {
    logEventServiceDebug('updateEventService: MongoDB not connected.', { id });
    return null;
  }

  try {
    const updatesWithDate = { ...updates };

    if (updates.dateTime) {
      updatesWithDate.dateTime = new Date(updates.dateTime);
    }

    // Normalize category/category-style fields if present
    if (updates.category !== undefined || updates.categories !== undefined) {
      updatesWithDate.category = normalizeCategoryInput(updates);
      delete updatesWithDate.categories;
    }

    logEventServiceDebug('updateEventService: updating event', {
      id,
      updates: updatesWithDate
    });

    const doc = await Event.findByIdAndUpdate(id, updatesWithDate, {
      new: true
    });

    const normalized = normalizeEventDoc(doc);

    if (!normalized) {
      logEventServiceDebug('updateEventService: event not found', { id });
    } else {
      logEventServiceDebug('updateEventService: event updated', {
        id: normalized.id,
        title: normalized.title
      });
    }

    return normalized;
  } catch (err) {
    logEventServiceError('updateEventService FAILED', err);
    throw err;
  }
};

/**
 * Delete an event by id.
 * @async
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export const deleteEventService = async (id) => {
  if (!isDbConnected()) {
    logEventServiceDebug('deleteEventService: MongoDB not connected.', { id });
    return false;
  }

  try {
    logEventServiceDebug('deleteEventService: deleting event', { id });
    const result = await Event.findByIdAndDelete(id);
    const success = !!result;

    logEventServiceDebug('deleteEventService: delete result', { id, success });

    return success;
  } catch (err) {
    logEventServiceError('deleteEventService FAILED', err);
    throw err;
  }
};

/**
 * Get events liked by a specific user.
 * NOTE: This is a placeholder. Implementation depends on how you model likes.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export const getLikedEventsByUserService = async (userId) => {
  if (!userId) return [];
  logEventServiceDebug(
    'getLikedEventsByUserService: called but not implemented',
    { userId }
  );
  // TODO: implement with a Like model or similar.
  return [];
};
