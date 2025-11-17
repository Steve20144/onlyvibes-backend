// src/controllers/eventController.js
import {
  listEventsService,
  getEventByIdService,
  createEventService,
  updateEventService,
  deleteEventService
} from '../services/eventService.js';

const editableEventFields = new Set([
  'title',
  'description',
  'category',
  'dateTime',
  'location',
  'latitude',
  'longitude',
  'imageUrl',
  'isCancelled'
]);

const validationError = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

const parseEventId = (value) => {
  const eventId = Number(value);
  if (Number.isNaN(eventId)) {
    throw validationError('Invalid event id');
  }
  return eventId;
};

const sanitizeEventUpdates = (payload = {}) => {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Request body must be a JSON object.');
  }

  const sanitized = {};
  let touched = false;

  for (const [key, value] of Object.entries(payload)) {
    if (!editableEventFields.has(key)) {
      throw validationError(`Field "${key}" cannot be updated.`);
    }

    touched = true;

    switch (key) {
      case 'title': {
        if (typeof value !== 'string' || value.trim().length < 3) {
          throw validationError('Title must be a string with at least 3 characters.');
        }
        sanitized.title = value.trim();
        break;
      }
      case 'description': {
        if (value !== undefined && value !== null && typeof value !== 'string') {
          throw validationError('Description must be a string.');
        }
        sanitized.description = value ?? '';
        break;
      }
      case 'category': {
        if (typeof value !== 'string' || value.trim().length === 0) {
          throw validationError('Category must be a non-empty string.');
        }
        sanitized.category = value.trim();
        break;
      }
      case 'dateTime': {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          throw validationError('dateTime must be a valid ISO date string.');
        }
        sanitized.dateTime = date;
        break;
      }
      case 'location': {
        if (typeof value !== 'string' || value.trim().length < 2) {
          throw validationError('Location must be a string with at least 2 characters.');
        }
        sanitized.location = value.trim();
        break;
      }
      case 'latitude':
      case 'longitude': {
        if (value === null || value === undefined || value === '') {
          sanitized[key] = null;
          break;
        }
        const num = Number(value);
        if (Number.isNaN(num)) {
          throw validationError(`${key} must be a number.`);
        }
        sanitized[key] = num;
        break;
      }
      case 'imageUrl': {
        if (value !== undefined && value !== null && typeof value !== 'string') {
          throw validationError('imageUrl must be a string.');
        }
        sanitized.imageUrl = value ?? null;
        break;
      }
      case 'isCancelled': {
        if (typeof value !== 'boolean') {
          throw validationError('isCancelled must be a boolean.');
        }
        sanitized.isCancelled = value;
        break;
      }
      default:
        break;
    }
  }

  if (!touched) {
    throw validationError('Provide at least one editable field to update.');
  }

  return sanitized;
};

/**
 * List events (optionally filtered).
 */
export const listEvents = async (req, res, next) => {
  try {
    const { category, location } = req.query;

    const events = await listEventsService({ category, location });

    let message = 'Events retrieved';
    if (events.length === 0) {
      message =
        category || location
          ? 'No events found. Try adjusting your filters.'
          : 'No events found.';
    }

    return res.status(200).json({
      success: true,
      data: events,
      error: null,
      message
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get one event by id.
 */
export const getEventById = async (req, res, next) => {
  try {
    const eventId = parseEventId(req.params.id);

    const event = await getEventByIdService(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: event,
      error: null,
      message: 'Event retrieved'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new event.
 */
export const createEvent = async (req, res, next) => {
  try {
    const creatorId = req.body.creatorId || 'venue-1';
    const event = await createEventService(creatorId, req.body);

    return res.status(201).json({
      success: true,
      data: event,
      error: null,
      message: 'Event created successfully'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update an existing event.
 */
export const updateEvent = async (req, res, next) => {
  try {
    const eventId = parseEventId(req.params.id);
    const sanitizedUpdates = sanitizeEventUpdates(req.body);

    const updated = await updateEventService(eventId, sanitizedUpdates);
    if (!updated) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: updated,
      error: null,
      message: 'Event updated successfully'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete an event by id.
 * (Use 200 so we can send {success, data, error, message})
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const eventId = parseEventId(req.params.id);

    const deleted = await deleteEventService(eventId);
    if (!deleted) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: null,
      error: null,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
};
