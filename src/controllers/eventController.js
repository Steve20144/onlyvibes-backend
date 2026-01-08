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

/**
 * Logs debug messages for the event controller if debugging is enabled.
 * @param {...any} args - The messages to log.
 */
const logEventControllerDebug = (...args) => {
  if (process.env.DEBUG_EVENTS === 'true' || process.env.DEBUG === 'true') {
    console.log('[EVENT_CONTROLLER]', ...args);
  }
};

/**
 * Logs error messages for the event controller.
 * @param {...any} args - The error messages to log.
 */
const logEventControllerError = (...args) => {
  console.error('[EVENT_CONTROLLER]', ...args);
};

// A set of fields that are permitted to be updated on an event.
const editableEventFields = new Set([
  'title',
  'description',
  'category',
  'dateTime',
  'location',
  'imageUrl'
]);

/**
 * Creates a validation error object with a given message.
 * @param {string} message - The error message.
 * @returns {Error} An error object with a 400 status code.
 */
const validationError = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

/**
 * Checks if a value is a valid MongoDB ObjectId string.
 * @param {string} value - The value to check.
 * @returns {boolean} True if the value is a valid ObjectId, false otherwise.
 */
const isValidObjectId = (value) =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);

/**
 * Parses and validates an event ID from a request parameter.
 * @param {string} value - The event ID to parse.
 * @returns {string} The validated event ID.
 * @throws {Error} If the event ID is invalid.
 */
const parseEventId = (value) => {
  if (!isValidObjectId(value)) {
    throw validationError('Invalid event id');
  }
  return value;
};

/**
 * Sanitizes and validates the payload for updating an event.
 * @param {object} payload - The request body containing event updates.
 * @returns {object} The sanitized update object.
 * @throws {Error} If the payload is invalid or contains disallowed fields.
 */
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

  logEventControllerDebug('sanitizeEventUpdates: sanitized payload', sanitized);

  return sanitized;
};

/**
 * Handles the request to list all events, with optional filtering.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A JSON response with the list of events.
 */
export const listEvents = async (req, res, next) => {
  try {
    const { category, location } = req.query;

    logEventControllerDebug('listEvents: incoming request', {
      query: req.query
    });

    const events = await listEventsService({ category, location });

    let message = 'Events retrieved';
    if (events.length === 0) {
      message =
        category || location
          ? 'No events found. Try adjusting your filters.'
          : 'No events found.';
    }

    logEventControllerDebug('listEvents: sending response', {
      count: events.length,
      message
    });

    return res.status(200).json({
      success: true,
      data: events,
      error: null,
      message
    });
  } catch (error) {
    logEventControllerError('listEvents FAILED', error);
    return next(error);
  }
};

/**
 * Retrieves a single event by its ID.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} The event data or an error message.
 */
export const getEventById = async (req, res, next) => {
  try {
    logEventControllerDebug('getEventById: incoming request', {
      params: req.params
    });

    const eventId = parseEventId(req.params.id);

    const event = await getEventByIdService(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    logEventControllerDebug('getEventById: event found', {
      id: event.id,
      title: event.title
    });

    return res.status(200).json({
      success: true,
      data: event,
      error: null,
      message: 'Event retrieved'
    });
  } catch (error) {
    logEventControllerError('getEventById FAILED', error);
    return next(error);
  }
};

/**
 * Handles the creation of a new event.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} The created event data.
 */
export const createEvent = async (req, res, next) => {
  try {
    logEventControllerDebug('createEvent: incoming request', {
      body: req.body
    });

    // In production this should come from auth middleware: req.user.id
    const creatorId = req.user?.id || req.body.creatorId;

    if (!creatorId || !isValidObjectId(creatorId)) {
      throw validationError('A valid creatorId is required.');
    }

    const event = await createEventService({
      ...req.body,
      creatorId
    });

    logEventControllerDebug('createEvent: event created', {
      id: event.id,
      title: event.title
    });

    return res.status(201).json({
      success: true,
      data: event,
      error: null,
      message: 'Event created successfully'
    });
  } catch (error) {
    logEventControllerError('createEvent FAILED', error);
    return next(error);
  }
};

/**
 * Updates an existing event by its ID.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} The updated event data.
 */
export const updateEvent = async (req, res, next) => {
  try {
    logEventControllerDebug('updateEvent: incoming request', {
      params: req.params,
      body: req.body
    });

    const eventId = parseEventId(req.params.id);
    const sanitizedUpdates = sanitizeEventUpdates(req.body);

    const updated = await updateEventService(eventId, sanitizedUpdates);
    if (!updated) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    logEventControllerDebug('updateEvent: event updated', {
      id: updated.id,
      title: updated.title
    });

    return res.status(200).json({
      success: true,
      data: updated,
      error: null,
      message: 'Event updated successfully'
    });
  } catch (error) {
    logEventControllerError('updateEvent FAILED', error);
    return next(error);
  }
};

/**
 * Deletes an event by its ID.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A confirmation message.
 */
export const deleteEvent = async (req, res, next) => {
  try {
    logEventControllerDebug('deleteEvent: incoming request', {
      params: req.params
    });

    const eventId = parseEventId(req.params.id);

    const deleted = await deleteEventService(eventId);
    if (!deleted) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    logEventControllerDebug('deleteEvent: event deleted', {
      id: eventId
    });

    return res.status(200).json({
      success: true,
      data: null,
      error: null,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logEventControllerError('deleteEvent FAILED', error);
    return next(error);
  }
};

/**
 * Retrieves a list of events that a user has liked.
 * @async
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A list of liked events.
 */
export const listLikedEvents = async (req, res, next) => {
  try {
    logEventControllerDebug('listLikedEvents: incoming request', {
      params: req.params
    });

    const { userId } = req.params;
    if (!userId || typeof userId !== 'string') {
      throw validationError('userId parameter is required.');
    }

    const likedEvents = await getLikedEventsByUserService(userId.trim());

    const message =
      likedEvents.length === 0
        ? 'User has not liked any events yet'
        : 'Liked events retrieved';

    logEventControllerDebug('listLikedEvents: sending response', {
      count: likedEvents.length,
      message
    });

    return res.status(200).json({
      success: true,
      data: likedEvents,
      error: null,
      message
    });
  } catch (error) {
    logEventControllerError('listLikedEvents FAILED', error);
    return next(error);
  }
};
