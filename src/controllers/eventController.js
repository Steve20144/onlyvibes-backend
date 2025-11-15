// src/controllers/eventsController.js

const { events } = require("../data/events");
const {
  Event,
  createEventFromBody,
  updateEventFromBody,
  sanitizeEvent,
} = require("../models/event");

// In-memory αντιγραφή ώστε να μπορούμε να τροποποιούμε το state
let eventsData = [...events];

function getNextEventId() {
  const maxId =
    eventsData.length > 0
      ? Math.max(...eventsData.map((e) => Number(e.eventId)))
      : 0;
  return maxId + 1;
}

// ---------- GET /events ----------
// Optional filters (από Swagger):
// ?category=...&location=...&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&sort=...
function getEvents(req, res) {
  const { category, location, fromDate, toDate, sort } = req.query;

  let result = [...eventsData];

  if (category) {
    result = result.filter((e) => e.category === category);
  }

  if (location) {
    result = result.filter((e) => e.location === location);
  }

  if (fromDate) {
    const from = new Date(fromDate);
    result = result.filter((e) => new Date(e.dateTime) >= from);
  }

  if (toDate) {
    const to = new Date(toDate);
    result = result.filter((e) => new Date(e.dateTime) <= to);
  }

  // Απλό sort by dateTime αν δοθεί κάτι σχετικό
  if (sort && sort.toLowerCase().includes("date")) {
    result.sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );
  }

  res.status(200).json({
    data: result.map(sanitizeEvent),
  });
}

// ---------- POST /events ----------
// Βασίζεται στο EventCreate schema (title, category, dateTime, location required)
function createEvent(req, res, next) {
  try {
    // creatorId μπορεί να έρθει από auth context,
    // για τώρα το παίρνουμε από body.ownerId αν υπάρχει
    const creatorIdFromContext = req.body.ownerId ?? null;

    const newEvent = createEventFromBody(req.body, creatorIdFromContext);
    newEvent.eventId = getNextEventId();

    eventsData.push(newEvent);

    res.status(201).json({
      data: sanitizeEvent(newEvent),
    });
  } catch (err) {
    next(err);
  }
}

// ---------- GET /events/:eventId ----------
function getEventById(req, res) {
  const eventId = Number(req.params.eventId);

  const event = eventsData.find((e) => Number(e.eventId) === eventId);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.status(200).json({
    data: sanitizeEvent(event),
  });
}

// ---------- PUT /events/:eventId ----------
function updateEvent(req, res, next) {
  try {
    const eventId = Number(req.params.eventId);
    const index = eventsData.findIndex(
      (e) => Number(e.eventId) === eventId
    );

    if (index === -1) {
      return res.status(404).json({ error: "Event not found" });
    }

    const existingEvent = eventsData[index];

    const updated = updateEventFromBody(existingEvent, req.body);

    eventsData[index] = updated;

    res.status(200).json({
      data: sanitizeEvent(updated),
    });
  } catch (err) {
    next(err);
  }
}

// ---------- DELETE /events/:eventId ----------
function deleteEvent(req, res) {
  const eventId = Number(req.params.eventId);
  const index = eventsData.findIndex(
    (e) => Number(e.eventId) === eventId
  );

  if (index === -1) {
    return res.status(404).json({ error: "Event not found" });
  }

  eventsData.splice(index, 1);

  // Σύμφωνα με Swagger: 204 No Content
  return res.status(204).send();
}

module.exports = {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
};
