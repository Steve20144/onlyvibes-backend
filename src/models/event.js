// src/models/event.js

/**
 * Event model based on the Swagger spec:
 *
 * components.schemas.Event:
 *  - eventId: integer
 *  - creatorId: integer
 *  - title: string
 *  - description: string
 *  - category: string
 *  - dateTime: string (date-time)
 *  - location: string
 *  - imageUrl: string (uri)
 *  - isCancelled: boolean
 *
 * components.schemas.EventCreate (used for creation):
 *  required:
 *    - title
 *    - category
 *    - dateTime
 *    - location
 */

class Event {
  constructor(
    eventId,
    creatorId,
    title,
    description,
    category,
    dateTime,
    location,
    imageUrl,
    isCancelled
  ) {
    this.eventId = eventId;          // integer
    this.creatorId = creatorId;      // integer
    this.title = title;              // string
    this.description = description;  // string
    this.category = category;        // string
    this.dateTime = dateTime;        // ISO string
    this.location = location;        // string
    this.imageUrl = imageUrl;        // string (uri)
    this.isCancelled = Boolean(isCancelled); // boolean
  }
}

/**
 * Create a new Event from the request body (EventCreate shape).
 * eventId will be assigned later (e.g. in the controller).
 * creatorId can be passed explicitly (e.g. from logged-in user),
 * or fall back to body.ownerId if present.
 */
function createEventFromBody(body, creatorIdFromContext) {
  const {
    title,
    description,
    category,
    dateTime,
    location,
    imageUrl,
    eventId,   // optional in EventCreate
    ownerId,   // optional in EventCreate
  } = body;

  // Required fields from EventCreate schema
  if (!title || !category || !dateTime || !location) {
    const err = new Error("title, category, dateTime and location are required");
    err.status = 400;
    throw err;
  }

  const creatorId = creatorIdFromContext ?? ownerId ?? null;

  return new Event(
    eventId ?? null,   // will typically be set in the controller
    creatorId ?? null, // may remain null in pure-mock mode
    title,
    description ?? "",
    category,
    dateTime,
    location,
    imageUrl ?? "",
    false // new events are not cancelled by default
  );
}

/**
 * Merge an update payload (EventCreate shape) into an existing Event.
 * This respects the same fields as Event / EventCreate.
 */
function updateEventFromBody(existingEvent, body) {
  const {
    title,
    description,
    category,
    dateTime,
    location,
    imageUrl,
    isCancelled,
  } = body;

  return new Event(
    existingEvent.eventId,
    existingEvent.creatorId,
    title ?? existingEvent.title,
    description ?? existingEvent.description,
    category ?? existingEvent.category,
    dateTime ?? existingEvent.dateTime,
    location ?? existingEvent.location,
    imageUrl ?? existingEvent.imageUrl,
    typeof isCancelled === "boolean" ? isCancelled : existingEvent.isCancelled
  );
}

/**
 * Sanitize event before sending it to the client.
 * (Right now Event has no sensitive fields, but keeping this
 * consistent with Account is useful.)
 */
function sanitizeEvent(event) {
  if (!event) return null;
  // Shallow clone to avoid accidental mutations
  return { ...event };
}

module.exports = {
  Event,
  createEventFromBody,
  updateEventFromBody,
  sanitizeEvent,
};
