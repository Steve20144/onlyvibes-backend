const {
  listEvents,
  findEventById,
  createEventRecord,
  updateEventRecord,
  deleteEventRecord
} = require('../data/events');
const { findAccountById } = require('../data/accounts');
const { validateEventPayload, validateEventUpdate } = require('../models/event');

const buildError = (status, message, details) => ({ status, message, details });

const getAllEvents = (filters) => listEvents(filters);

const getEvent = (eventId) => {
  const event = findEventById(eventId);
  if (!event) {
    throw buildError(404, 'Event not found');
  }

  return event;
};

const createEvent = (payload) => {
  const validation = validateEventPayload(payload);
  if (!validation.isValid) {
    throw buildError(400, 'Invalid event payload', validation.errors);
  }

  const organizer = findAccountById(payload.organizerId);
  if (!organizer) {
    throw buildError(404, 'Organizer not found');
  }

  if (!['verified-user', 'venue', 'admin'].includes(organizer.role)) {
    throw buildError(403, 'Only verified users, venues, or admins can create events');
  }

  return createEventRecord(payload);
};

const updateEvent = (eventId, updates) => {
  const validation = validateEventUpdate(updates);
  if (!validation.isValid) {
    throw buildError(400, 'Invalid event update', validation.errors);
  }

  const updated = updateEventRecord(eventId, updates);
  if (!updated) {
    throw buildError(404, 'Event not found');
  }

  return updated;
};

const deleteEvent = (eventId) => {
  const deleted = deleteEventRecord(eventId);
  if (!deleted) {
    throw buildError(404, 'Event not found');
  }
};

module.exports = {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
};
