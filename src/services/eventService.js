// src/services/eventService.js
import mongoose from 'mongoose';
import Event from '../models/event.js';

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
    console.warn('listEventsService: MongoDB not connected.');
    return [];
  }

  const query = {};

  if (category) {
    // Match events where `category` array contains this category
    query.category = category;
  }

  if (location) {
    // Case-insensitive substring match on location
    query.location = new RegExp(location, 'i');
  }

  const docs = await Event.find(query).sort({ dateTime: 1 });
  return docs.map(normalizeEventDoc);
};

/**
 * Get one event by Mongo _id (string).
 * @async
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export const getEventByIdService = async (id) => {
  if (!isDbConnected()) {
    console.warn('getEventByIdService: MongoDB not connected.');
    return null;
  }

  const doc = await Event.findById(id);
  return normalizeEventDoc(doc);
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
    console.warn('createEventService: MongoDB not connected.');
    throw new Error('Database not available');
  }

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

  const doc = await Event.create(baseData);
  return normalizeEventDoc(doc);
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
    console.warn('updateEventService: MongoDB not connected.');
    return null;
  }

  const updatesWithDate = { ...updates };

  if (updates.dateTime) {
    updatesWithDate.dateTime = new Date(updates.dateTime);
  }

  // Normalize category/category-style fields if present
  if (updates.category !== undefined || updates.categories !== undefined) {
    updatesWithDate.category = normalizeCategoryInput(updates);
    delete updatesWithDate.categories;
  }

  const doc = await Event.findByIdAndUpdate(id, updatesWithDate, {
    new: true
  });

  return normalizeEventDoc(doc);
};

/**
 * Delete an event by id.
 * @async
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export const deleteEventService = async (id) => {
  if (!isDbConnected()) {
    console.warn('deleteEventService: MongoDB not connected.');
    return false;
  }

  const result = await Event.findByIdAndDelete(id);
  return !!result;
};

/**
 * Get events liked by a specific user.
 * NOTE: This is a placeholder. Implementation depends on how you model likes.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export const getLikedEventsByUserService = async (userId) => {
  if (!userId) return [];
  // TODO: implement with a Like model or similar.
  console.warn(
    'getLikedEventsByUserService: not implemented yet – returning empty list.'
  );
  return [];
};
