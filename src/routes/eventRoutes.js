// src/routes/eventRoutes.js
import { Router } from 'express';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';

const router = Router();

// GET /events - list / filter events
router.get('/', listEvents);

// GET /events/:id - get a single event
router.get('/:id', getEventById);

// POST /events - create an event
router.post('/', createEvent);

// PUT /events/:id - update an event
router.put('/:id', updateEvent);

// DELETE /events/:id - delete an event
router.delete('/:id', deleteEvent);

export default router;
