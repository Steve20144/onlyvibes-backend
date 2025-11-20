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
 * List events with optional filters.
 * @async
 * @param {{category?:string,location?:string}} filters
 * @returns {Promise<object[]>}
 */
export const listEventsService = async (filters = {}) => {
  const { category, location } = filters;

  if (!isDbConnected()) {
    // If you want, you can throw here or handle differently
    console.warn('listEventsService: MongoDB not connected.');
    return [];
  }

  const query = {};

  if (category) {
    // Match events where `categories` array contains this category
    query.categories = category;
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
 * @param {{
 *   creatorId: string,
 *   title: string,
 *   description?: string,
 *   location: string,
 *   dateTime: string | Date,
 *   categories: string[] | string,
 *   imageUrl?: string
 * }} payload
 * @returns {Promise<object>}
 */
export const createEventService = async (payload) => {
  if (!isDbConnected()) {
    console.warn('createEventService: MongoDB not connected.');
    throw new Error('Database not available');
  }

  let categories = payload.categories;

  if (typeof categories === 'string') {
    categories = categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  const baseData = {
    creatorId: payload.creatorId,
    title: payload.title,
    description: payload.description || '',
    location: payload.location,
    dateTime: new Date(payload.dateTime),
    categories,
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

  // If categories comes as a comma-separated string, normalize it
  if (typeof updatesWithDate.categories === 'string') {
    updatesWithDate.categories = updatesWithDate.categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
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
