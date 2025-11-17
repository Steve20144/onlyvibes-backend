// src/controllers/eventController.js
import {
  listEventsService,
  getEventByIdService,
  createEventService,
  updateEventService,
  deleteEventService
} from '../services/eventService.js';

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
    const eventId = Number(req.params.id);
    if (Number.isNaN(eventId)) {
      const err = new Error('Invalid event id');
      err.statusCode = 400;
      throw err;
    }

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
    const eventId = Number(req.params.id);
    if (Number.isNaN(eventId)) {
      const err = new Error('Invalid event id');
      err.statusCode = 400;
      throw err;
    }

    const updated = await updateEventService(eventId, req.body);
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
    const eventId = Number(req.params.id);
    if (Number.isNaN(eventId)) {
      const err = new Error('Invalid event id');
      err.statusCode = 400;
      throw err;
    }

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
