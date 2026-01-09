// src/services/eventService.js
import Event from '../models/event.js';
import { isDbConnected } from '../utils/dbHealth.js';

/**
 * Logs debug messages for the event service if debugging is enabled.
 * @param {...any} args - The messages to log.
 */
const logEventServiceDebug = (...args) => {
  if (process.env.DEBUG_EVENTS === 'true' || process.env.DEBUG === 'true') {
    console.log('[EVENT_SERVICE]', ...args);
  }
};

/**
 * Logs error messages for the event service.
 * @param {...any} args - The error messages to log.
 */
const logEventServiceError = (...args) => {
  console.error('[EVENT_SERVICE]', ...args);
};

/**
 * Normalizes a Mongoose document into a plain JavaScript object,
 * converting `_id` to `id` and removing the version key `__v`.
 * @param {object} doc - The Mongoose document to normalize.
 * @returns {object|null} The normalized object, or null if the input is falsy.
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
 * Normalizes category-related input from various formats into a consistent array of strings.
 * It can handle single strings, comma-separated strings, or arrays of strings.
 * @param {object} payload - The input payload which may contain `category` or `categories`.
 * @returns {string[]} An array of category strings.
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
 * Retrieves a list of events, with optional filtering by category and location.
 * @async
 * @param {object} [filters={}] - The filter criteria.
 * @param {string} [filters.category] - The category to filter by.
 * @param {string} [filters.location] - The location to filter by (case-insensitive).
 * @returns {Promise<object[]>} A promise that resolves to an array of event objects.
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
 * Retrieves a single event by its MongoDB `_id`.
 * @async
 * @param {string} id - The ID of the event to retrieve.
 * @returns {Promise<object|null>} A promise that resolves to the event object, or null if not found.
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
 * Creates a new event with the given payload.
 * @async
 * @param {object} payload - The data for the new event.
 * @param {string} payload.creatorId - The ID of the user creating the event.
 * @param {string} payload.title - The title of the event.
 * @param {string} [payload.description] - The description of the event.
 * @param {string} payload.location - The location of the event.
 * @param {string|Date} payload.dateTime - The date and time of the event.
 * @param {string|string[]} [payload.category] - The categories of the event.
 * @param {string} [payload.imageUrl] - The URL for the event's image.
 * @returns {Promise<object>} A promise that resolves to the newly created event object.
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
 * Updates an existing event with new data.
 * @async
 * @param {string} id - The ID of the event to update.
 * @param {object} updates - An object containing the fields to update.
 * @returns {Promise<object|null>} A promise that resolves to the updated event object, or null if not found.
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
 * Deletes an event by its ID.
 * @async
 * @param {string} id - The ID of the event to delete.
 * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful, false otherwise.
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
 * Retrieves events liked by a specific user.
 * NOTE: This is a placeholder and is not yet implemented.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object[]>} A promise that resolves to an array of liked event objects.
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
