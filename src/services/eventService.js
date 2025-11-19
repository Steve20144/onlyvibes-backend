// src/services/eventService.js
import mongoose from 'mongoose';
import Event from '../models/Event.js'; // <- adjust if your model path/name is different
import { events, getNextEventId } from '../data/events.js';
import { eventLikes } from '../data/eventLikes.js';

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
 * Tries MongoDB first; falls back to mock data if DB is unavailable or query fails.
 * @async
 * @param {{category?:string,location?:string}} filters
 * @returns {Promise<object[]>}
 */
export const listEventsService = async (filters = {}) => {
  const { category, location } = filters;

  if (isDbConnected()) {
    try {
      const query = {};

      if (category) {
        query.category = category;
      }

      if (location) {
        // Case-insensitive substring match on location
        query.location = new RegExp(location, 'i');
      }

      const docs = await Event.find(query);
      return docs.map(normalizeEventDoc);
    } catch (error) {
      console.error('listEventsService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  let result = [...events];

  if (category) {
    result = result.filter((e) => e.category === category);
  }

  if (location) {
    const loc = location.toLowerCase();
    result = result.filter((e) =>
      (e.location || '').toLowerCase().includes(loc)
    );
  }

  return result;
};

/**
 * Get one event by eventId.
 * Tries MongoDB first; falls back to mock if DB not available or query fails.
 * @async
 * @param {number} eventId
 * @returns {Promise<object|null>}
 */
export const getEventByIdService = async (eventId) => {
  if (isDbConnected()) {
    try {
      // Assuming your Event schema has an `eventId` field
      const doc = await Event.findOne({ eventId });
      return normalizeEventDoc(doc);
    } catch (error) {
      console.error('getEventByIdService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  const event = events.find((e) => e.eventId === eventId);
  return event || null;
};

/**
 * Create a new event.
 * Tries MongoDB first; falls back to mock if DB not available or query fails.
 * @async
 * @param {string} creatorId
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const createEventService = async (creatorId, payload) => {
  const baseData = {
    eventId: getNextEventId(), // used both in DB and mock so IDs stay consistent
    creatorId,
    title: payload.title,
    description: payload.description || '',
    category: payload.category,
    dateTime: new Date(payload.dateTime),
    location: payload.location,
    latitude: payload.latitude || null,
    longitude: payload.longitude || null,
    imageUrl: payload.imageUrl || null,
    isCancelled: false
  };

  if (isDbConnected()) {
    try {
      const doc = await Event.create(baseData);
      return normalizeEventDoc(doc);
    } catch (error) {
      console.error('createEventService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  events.push(baseData);
  return baseData;
};

/**
 * Update an existing event.
 * Tries MongoDB first; falls back to mock if DB not available or query fails.
 * @async
 * @param {number} eventId
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
export const updateEventService = async (eventId, updates) => {
  const updatesWithDate = { ...updates };

  if (updates.dateTime) {
    updatesWithDate.dateTime = new Date(updates.dateTime);
  }

  if (isDbConnected()) {
    try {
      const doc = await Event.findOneAndUpdate(
        { eventId },
        updatesWithDate,
        { new: true }
      );

      return normalizeEventDoc(doc);
    } catch (error) {
      console.error('updateEventService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  const index = events.findIndex((e) => e.eventId === eventId);
  if (index === -1) return null;

  const updated = {
    ...events[index],
    ...updatesWithDate
  };

  events[index] = updated;
  return updated;
};

/**
 * Delete an event by id.
 * Tries MongoDB first; falls back to mock if DB not available or query fails.
 * @async
 * @param {number} eventId
 * @returns {Promise<boolean>}
 */
export const deleteEventService = async (eventId) => {
  if (isDbConnected()) {
    try {
      const result = await Event.findOneAndDelete({ eventId });
      return !!result;
    } catch (error) {
      console.error('deleteEventService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  const index = events.findIndex((e) => e.eventId === eventId);
  if (index === -1) return false;

  events.splice(index, 1);
  return true;
};

/**
 * Get events liked by a specific user (most recent first).
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export const getLikedEventsByUserService = async (userId) => {
  if (!userId) return [];

  const likesForUser = eventLikes
    .filter((like) => like.userId === userId)
    .sort((a, b) => b.likedAt - a.likedAt);

  return likesForUser
    .map((like) => {
      const event = events.find((e) => e.eventId === like.eventId);
      if (!event) return null;
      return {
        eventId: event.eventId,
        title: event.title,
        category: event.category,
        location: event.location,
        dateTime: event.dateTime,
        imageUrl: event.imageUrl,
        likedAt: like.likedAt
      };
    })
    .filter(Boolean);
};
