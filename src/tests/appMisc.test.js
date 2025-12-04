import request from 'supertest';
import { jest } from '@jest/globals';

const logRequestMock = jest.fn();
const listEventsServiceMock = jest.fn().mockResolvedValue([]);

jest.unstable_mockModule('../utils/logger.js', () => ({
  logRequest: logRequestMock,
  logError: jest.fn()
}));

jest.unstable_mockModule('../services/eventService.js', () => ({
  listEventsService: listEventsServiceMock,
  getEventByIdService: jest.fn(),
  createEventService: jest.fn(),
  updateEventService: jest.fn(),
  deleteEventService: jest.fn(),
  getLikedEventsByUserService: jest.fn()
}));

const app = (await import('../app.js')).default;
const eventService = await import('../services/eventService.js');

describe('App infrastructure endpoints', () => {
  beforeEach(() => {
    logRequestMock.mockClear();
    listEventsServiceMock.mockReset();
    listEventsServiceMock.mockResolvedValue([]);
  });

  test('GET /health returns service heartbeat payload', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { status: 'ok' },
      error: null,
      message: 'OnlyVibes API is healthy'
    });
  });

  test('request logging middleware masks sensitive fields before logging', async () => {
    await request(app).post('/non-existent').send({
      password: 'super-secret',
      note: 'log masking'
    });

    expect(logRequestMock).toHaveBeenCalled();
    const logged = logRequestMock.mock.calls.at(-1)[0];
    expect(logged).toContain('"note":"log masking"');
    expect(logged).toContain('"password":"***"');
    expect(logged).not.toContain('super-secret');
  });

  test('unknown routes trigger the JSON 404 handler', async () => {
    const res = await request(app).get('/totally-missing');

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: { path: '/totally-missing' },
      message: 'Route not found'
    });
  });

  test('centralized error handler surfaces status, message, and details', async () => {
    const err = new Error('Intentional failure');
    err.statusCode = 418;
    err.details = { reason: 'unit-test' };

    listEventsServiceMock.mockRejectedValueOnce(err);

    const res = await request(app).get('/events');

    expect(res.statusCode).toBe(418);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: {
        name: 'Error',
        details: { reason: 'unit-test' }
      },
      message: 'Intentional failure'
    });
  });
});
