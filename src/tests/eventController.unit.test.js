// src/tests/eventController.unit.test.js
/**
 * Unit tests for event controller functions.
 * 
 * This test suite validates:
 * - Controller-level input validation and sanitization
 * - Request payload normalization (trimming, type conversion)
 * - Error handling and forwarding to Express error middleware
 * - Service layer integration without database dependencies
 * - Response formatting for various scenarios (success, not found, validation errors)
 * 
 * Uses mocked event service to isolate controller logic.
 */
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock event service to isolate controller logic from database operations
jest.unstable_mockModule('../services/eventService.js', () => ({
  listEventsService: jest.fn(),
  getEventByIdService: jest.fn(),
  createEventService: jest.fn(),
  updateEventService: jest.fn(),
  deleteEventService: jest.fn(),
  getLikedEventsByUserService: jest.fn()
}));

const {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  listLikedEvents
} = await import('../controllers/eventController.js');
const eventService = await import('../services/eventService.js');

/**
 * Helper function to create a mock Express response object.
 * Provides chainable status() and json() methods for testing.
 */
const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

/**
 * Test suite for event controller validation helpers.
 * Validates input sanitization and error handling before service calls.
 */
describe('eventController validation helpers', () => {
  // Reset mocks after each test to ensure test isolation
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test userId parameter validation - must be provided and non-empty
  test('listLikedEvents rejects missing userId parameters', async () => {
    eventService.getLikedEventsByUserService.mockResolvedValue([]);
    const req = { params: {} };
    const res = buildRes();
    const next = jest.fn();

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listLikedEvents(req, res, next);

    expect(eventService.getLikedEventsByUserService).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'userId parameter is required.',
        statusCode: 400
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // Test request body type validation - must be an object, not null or array
  test('updateEvent rejects non-object payloads before hitting service', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    eventService.updateEventService.mockResolvedValue(null);

    const req = { params: { id: validId }, body: null };
    const res = buildRes();
    const next = jest.fn();

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await updateEvent(req, res, next);

    expect(eventService.updateEventService).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Request body must be a JSON object.',
        statusCode: 400
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // Test payload sanitization - should trim strings and convert category formats
  test('updateEvent sanitizes payloads before forwarding to the service', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const sanitizedResponse = {
      id: validId,
      title: 'Trimmed Title',
      category: ['music', 'art'],
      description: '',
      location: 'Athens'
    };
    eventService.updateEventService.mockResolvedValue(sanitizedResponse);

    const req = {
      params: { id: validId },
      body: {
        title: '  Trimmed Title ',
        description: null,
        category: 'music, art ',
        location: ' Athens '
      }
    };
    const res = buildRes();
    const next = jest.fn();

    await updateEvent(req, res, next);

    expect(eventService.updateEventService).toHaveBeenCalledWith(validId, {
      title: 'Trimmed Title',
      description: '',
      category: ['music', 'art'],
      location: 'Athens'
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: sanitizedResponse,
        message: 'Event updated successfully'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // Test 404 handling - should surface not-found error when service returns null
  test('updateEvent surfaces not found errors when the service returns null', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    eventService.updateEventService.mockResolvedValue(null);

    const req = { params: { id: validId }, body: { title: 'Valid Title' } };
    const res = buildRes();
    const next = jest.fn();

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await updateEvent(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(eventService.updateEventService).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Event not found',
        statusCode: 404
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // Test empty result messaging - should provide friendly message when no likes exist
  test('listLikedEvents trims userId and returns empty message when no likes exist', async () => {
    eventService.getLikedEventsByUserService.mockResolvedValue([]);

    const req = { params: { userId: '  user-123  ' } };
    const res = buildRes();
    const next = jest.fn();

    await listLikedEvents(req, res, next);

    expect(eventService.getLikedEventsByUserService).toHaveBeenCalledWith('user-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User has not liked any events yet',
        data: []
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // Test positive result messaging - should return appropriate message with data
  test('listLikedEvents returns a positive message when liked events exist', async () => {
    const liked = [{ id: 'event-1' }];
    eventService.getLikedEventsByUserService.mockResolvedValue(liked);

    const req = { params: { userId: 'user-1' } };
    const res = buildRes();
    const next = jest.fn();

    await listLikedEvents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Liked events retrieved',
        data: liked
      })
    );
  });

  // Test userId type validation - must be a string, not a number
  test('listLikedEvents rejects non-string user ids', async () => {
    const req = { params: { userId: 123 } };
    const res = buildRes();
    const next = jest.fn();

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listLikedEvents(req, res, next);

    expect(eventService.getLikedEventsByUserService).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'userId parameter is required.',
        statusCode: 400
      })
    );

    consoleErrorSpy.mockRestore();
  });
});

/**
 * Test suite for listEvents controller.
 * Validates event listing with filters and messaging.
 */
describe('listEvents controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test successful event listing - should return events with default message
  test('returns events and default message when service succeeds', async () => {
    eventService.listEventsService.mockResolvedValue([{ id: '1' }]);
    const req = { query: {} };
    const res = buildRes();
    const next = jest.fn();

    await listEvents(req, res, next);

    expect(eventService.listEventsService).toHaveBeenCalledWith({
      category: undefined,
      location: undefined
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ id: '1' }],
        message: 'Events retrieved'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // Test empty results with filters - should provide helpful filter adjustment message
  test('returns friendly filter message when no events match filters', async () => {
    eventService.listEventsService.mockResolvedValue([]);
    const req = { query: { category: 'music', location: 'ath' } };
    const res = buildRes();
    const next = jest.fn();

    await listEvents(req, res, next);

    expect(eventService.listEventsService).toHaveBeenCalledWith({
      category: 'music',
      location: 'ath'
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [],
        message: 'No events found. Try adjusting your filters.'
      })
    );
  });

  // Test error handling - should forward service errors to Express error middleware
  test('forwards service errors to next', async () => {
    const error = new Error('db down');
    eventService.listEventsService.mockRejectedValue(error);
    const req = { query: {} };
    const res = buildRes();
    const next = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listEvents(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

/**
 * Test suite for getEventById controller.
 * Validates single event retrieval and ID validation.
 */
describe('getEventById controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test ID format validation - should reject invalid ObjectId strings
  test('rejects invalid ids before hitting the service', async () => {
    const req = { params: { id: 'bad-id' } };
    const res = buildRes();
    const next = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getEventById(req, res, next);

    expect(eventService.getEventByIdService).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid event id',
        statusCode: 400
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // Test successful single event retrieval
  test('returns the event when found', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const event = { id, title: 'Party' };
    eventService.getEventByIdService.mockResolvedValue(event);

    const req = { params: { id } };
    const res = buildRes();
    const next = jest.fn();

    await getEventById(req, res, next);

    expect(eventService.getEventByIdService).toHaveBeenCalledWith(id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: event,
        message: 'Event retrieved'
      })
    );
  });

  // Test 404 handling when event doesn't exist
  test('surfaces not-found errors from the service', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    eventService.getEventByIdService.mockResolvedValue(null);
    const req = { params: { id } };
    const res = buildRes();
    const next = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getEventById(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Event not found',
        statusCode: 404
      })
    );

    consoleErrorSpy.mockRestore();
  });
});

/**
 * Test suite for createEvent controller.
 * Validates event creation with authenticated user handling.
 */
describe('createEvent controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test authenticated user preference - should use req.user.id over body.creatorId
  test('prefers the authenticated user id over body creatorId', async () => {
    const creatorId = new mongoose.Types.ObjectId().toString();
    const event = { id: '1', title: 'New Event' };
    eventService.createEventService.mockResolvedValue(event);

    const req = {
      user: { id: creatorId },
      body: {
        creatorId: new mongoose.Types.ObjectId().toString(),
        title: 'New Event',
        location: 'Athens',
        dateTime: new Date().toISOString(),
        category: ['music']
      }
    };
    const res = buildRes();
    const next = jest.fn();

    await createEvent(req, res, next);

    expect(eventService.createEventService).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId,
        title: 'New Event'
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: event,
        message: 'Event created successfully'
      })
    );
  });

  // Test creatorId requirement - must be provided and valid
  test('rejects when creatorId is missing or invalid', async () => {
    const req = {
      body: {
        title: 'Fail',
        location: 'Athens',
        dateTime: new Date().toISOString()
      }
    };
    const res = buildRes();
    const next = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await createEvent(req, res, next);

    expect(eventService.createEventService).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'A valid creatorId is required.',
        statusCode: 400
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // Test error propagation from service layer
  test('forwards service errors', async () => {
    const creatorId = new mongoose.Types.ObjectId().toString();
    const error = new Error('insert failed');
    eventService.createEventService.mockRejectedValue(error);

    const req = {
      user: { id: creatorId },
      body: {
        title: 'Boom',
        location: 'Athens',
        dateTime: new Date().toISOString()
      }
    };
    const res = buildRes();
    const next = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await createEvent(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

/**
 * Test suite for deleteEvent controller.
 * Validates event deletion with ID validation.
 */
describe('deleteEvent controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test ID validation before deletion
  test('rejects invalid ids before calling service', async () => {
    const req = { params: { id: 'bad' } };
    const res = buildRes();
    const next = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await deleteEvent(req, res, next);

    expect(eventService.deleteEventService).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid event id',
        statusCode: 400
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // Test 404 when deleting non-existent event
  test('surfaces not found errors when delete returns false', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    eventService.deleteEventService.mockResolvedValue(false);
    const req = { params: { id } };
    const res = buildRes();
    const next = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await deleteEvent(req, res, next);

    expect(eventService.deleteEventService).toHaveBeenCalledWith(id);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Event not found',
        statusCode: 404
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // Test successful deletion with proper response
  test('responds with success when delete returns true', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    eventService.deleteEventService.mockResolvedValue(true);

    const req = { params: { id } };
    const res = buildRes();
    const next = jest.fn();

    await deleteEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Event deleted successfully',
        data: null
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
