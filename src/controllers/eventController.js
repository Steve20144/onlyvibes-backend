// src/controllers/eventController.js
import mongoose from 'mongoose';
import {
  listEventsService,
  getEventByIdService,
  createEventService,
  updateEventService,
  deleteEventService,
  getLikedEventsByUserService
} from '../services/eventService.js';

const editableEventFields = new Set([
  'title',
  'description',
  'category',
  'dateTime',
  'location',
  'imageUrl'
]);

const validationError = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

const isValidObjectId = (value) =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);

/**
 * Validate and return a Mongo ObjectId string.
 */
const parseEventId = (value) => {
  if (!isValidObjectId(value)) {
    throw validationError('Invalid event id');
  }
  return value;
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
          throw validationError(
            'Title must be a string with at least 3 characters.'
          );
        }
        sanitized.title = value.trim();
        break;
      }
      case 'description': {
        if (
          value !== undefined &&
          value !== null &&
          typeof value !== 'string'
        ) {
          throw validationError('Description must be a string.');
        }
        sanitized.description = value ?? '';
        break;
      }
      case 'category': {
        // Accept array of strings OR comma-separated string from the UI
        let category = value;

        if (typeof category === 'string') {
          category = category
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
        }

        if (
          !Array.isArray(category) ||
          category.length === 0 ||
          !category.every((c) => typeof c === 'string' && c.length > 0)
        ) {
          throw validationError(
            'category must be a non-empty array of strings.'
          );
        }

        sanitized.category = category;
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
          throw validationError(
            'Location must be a string with at least 2 characters.'
          );
        }
        sanitized.location = value.trim();
        break;
      }
      case 'imageUrl': {
        if (
          value !== undefined &&
          value !== null &&
          typeof value !== 'string'
        ) {
          throw validationError('imageUrl must be a string.');
        }
        sanitized.imageUrl = value ?? null;
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
    // still accept ?category=... and ?location=...
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
    // In production this should come from auth middleware: req.user.id
    const creatorId = req.user?.id || req.body.creatorId;

    if (!creatorId || !isValidObjectId(creatorId)) {
      throw validationError('A valid creatorId is required.');
    }

    const event = await createEventService({
      ...req.body,
      creatorId
    });

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

/**
 * GET /events/liked/:userId - list events liked by a user
 * (placeholder implementation – depends on how you model likes)
 */
export const listLikedEvents = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string') {
      throw validationError('userId parameter is required.');
    }

    const likedEvents = await getLikedEventsByUserService(userId.trim());

    return res.status(200).json({
      success: true,
      data: likedEvents,
      error: null,
      message:
        likedEvents.length === 0
          ? 'User has not liked any events yet'
          : 'Liked events retrieved'
    });
  } catch (error) {
    return next(error);
  }
};
