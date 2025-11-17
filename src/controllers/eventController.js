const eventService = require('../services/eventServices');

const respondWithError = (res, error) => {
  const status = error.status || 500;
  const payload = { message: error.message };
  if (error.details) {
    payload.details = error.details;
  }

  return res.status(status).json(payload);
};

const listEvents = (req, res) => {
  try {
    const events = eventService.getAllEvents(req.query);
    return res.json({ results: events.length, events });
  } catch (error) {
    return respondWithError(res, error);
  }
};

const getEvent = (req, res) => {
  try {
    const event = eventService.getEvent(req.params.eventId);
    return res.json(event);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const createEvent = (req, res) => {
  try {
    const event = eventService.createEvent(req.body);
    return res.status(201).json(event);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const updateEvent = (req, res) => {
  try {
    const event = eventService.updateEvent(req.params.eventId, req.body);
    return res.json(event);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const deleteEvent = (req, res) => {
  try {
    eventService.deleteEvent(req.params.eventId);
    return res.status(204).send();
  } catch (error) {
    return respondWithError(res, error);
  }
};

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
};
