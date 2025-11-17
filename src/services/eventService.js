// src/services/eventService.js
import { events, getNextEventId } from '../data/events.js';

/**
 * List events with optional filters.
 * @async
 * @param {{category?:string,location?:string}} filters
 * @returns {Promise<object[]>}
 */
export const listEventsService = async (filters = {}) => {
  const { category, location } = filters;
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
 * @async
 * @param {number} eventId
 * @returns {Promise<object|null>}
 */
export const getEventByIdService = async (eventId) => {
  const event = events.find((e) => e.eventId === eventId);
  return event || null;
};

/**
 * Create a new event.
 * @async
 * @param {string} creatorId
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const createEventService = async (creatorId, payload) => {
  const newEvent = {
    eventId: getNextEventId(),
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

  events.push(newEvent);
  return newEvent;
};

/**
 * Update an existing event.
 * @async
 * @param {number} eventId
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
export const updateEventService = async (eventId, updates) => {
  const index = events.findIndex((e) => e.eventId === eventId);
  if (index === -1) return null;

  const updated = {
    ...events[index],
    ...updates
  };

  if (updates.dateTime) {
    updated.dateTime = new Date(updates.dateTime);
  }

  events[index] = updated;
  return updated;
};

/**
 * Delete an event by id.
 * @async
 * @param {number} eventId
 * @returns {Promise<boolean>}
 */
export const deleteEventService = async (eventId) => {
  const index = events.findIndex((e) => e.eventId === eventId);
  if (index === -1) return false;

  events.splice(index, 1);
  return true;
};
