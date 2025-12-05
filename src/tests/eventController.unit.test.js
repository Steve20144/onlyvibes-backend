// src/tests/eventController.unit.test.js
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

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

const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('eventController validation helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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

describe('listEvents controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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

describe('getEventById controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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

describe('createEvent controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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

describe('deleteEvent controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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
