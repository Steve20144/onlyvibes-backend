// src/routes/eventRoutes.js
import { Router } from 'express';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  listLikedEvents
} from '../controllers/eventController.js';

const router = Router();

/**
 * @route   GET /events
 * @desc    Get a list of events, with optional filtering
 * @access  Public
 */
router.get('/', listEvents);

/**
 * @route   GET /events/:id
 * @desc    Get a single event by its ID
 * @access  Public
 */
router.get('/:id', getEventById);

/**
 * @route   POST /events
 * @desc    Create a new event
 * @access  Private (requires authentication)
 */
router.post('/', createEvent);

/**
 * @route   PUT /events/:id
 * @desc    Update an existing event by its ID
 * @access  Private (requires authentication and ownership)
 */
router.put('/:id', updateEvent);

/**
 * @route   DELETE /events/:id
 * @desc    Delete an event by its ID
 * @access  Private (requires authentication and ownership)
 */
router.delete('/:id', deleteEvent);

/**
 * @route   GET /events/liked/:userId
 * @desc    Get a list of events liked by a specific user
 * @access  Public
 */
router.get('/liked/:userId', listLikedEvents);


export default router;
