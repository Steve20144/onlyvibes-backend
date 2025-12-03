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

const { listLikedEvents, updateEvent } = await import('../controllers/eventController.js');
const eventService = await import('../services/eventService.js');

describe('eventController validation helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('listLikedEvents rejects missing userId parameters', async () => {
    eventService.getLikedEventsByUserService.mockResolvedValue([]);
    const req = { params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    jest.spyOn(console, 'error').mockImplementation(() => {});

    await listLikedEvents(req, res, next);

    expect(eventService.getLikedEventsByUserService).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'userId parameter is required.',
        statusCode: 400
      })
    );
  });

  test('updateEvent rejects non-object payloads before hitting service', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    eventService.updateEventService.mockResolvedValue(null);

    const req = { params: { id: validId }, body: null };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    jest.spyOn(console, 'error').mockImplementation(() => {});

    await updateEvent(req, res, next);

    expect(eventService.updateEventService).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Request body must be a JSON object.',
        statusCode: 400
      })
    );
  });
});
