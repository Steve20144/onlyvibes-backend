// src/routes/events.routes.js

const express = require("express");
const {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/events.controller");

const router = express.Router();

// GET /events  (list with optional filters)
router.get("/", getEvents);

// POST /events  (create new event)
router.post("/", createEvent);

// GET /events/:eventId  (get by ID)
router.get("/:eventId", getEventById);

// PUT /events/:eventId  (update event)
router.put("/:eventId", updateEvent);

// DELETE /events/:eventId  (delete event)
router.delete("/:eventId", deleteEvent);

module.exports = router;
