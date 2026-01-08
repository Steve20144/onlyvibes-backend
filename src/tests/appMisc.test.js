/**
 * Integration tests for application infrastructure and middleware.
 * 
 * This test suite validates:
 * - Health check endpoint (GET /health)
 * - Request logging middleware with sensitive data masking
 * - 404 handler for unknown routes
 * - Centralized error handler with custom error details
 * 
 * Uses module mocking to isolate infrastructure components.
 */
import request from 'supertest';
import { jest } from '@jest/globals';

// Mock the logger module to track logging calls
const logRequestMock = jest.fn();
const listEventsServiceMock = jest.fn().mockResolvedValue([]);

// Mock logger module to intercept and verify logging calls
jest.unstable_mockModule('../utils/logger.js', () => ({
  logRequest: logRequestMock,
  logError: jest.fn()
}));

// Mock event service to control responses for error handling tests
jest.unstable_mockModule('../services/eventService.js', () => ({
  listEventsService: listEventsServiceMock,
  getEventByIdService: jest.fn(),
  createEventService: jest.fn(),
  updateEventService: jest.fn(),
  deleteEventService: jest.fn(),
  getLikedEventsByUserService: jest.fn()
}));

// Import app after mocks are configured
const app = (await import('../app.js')).default;
const eventService = await import('../services/eventService.js');

/**
 * Test suite for application infrastructure components.
 * Validates core middleware and error handling behavior.
 */
describe('App infrastructure endpoints', () => {
  // Reset mocks before each test to ensure clean state
  beforeEach(() => {
    logRequestMock.mockClear();
    listEventsServiceMock.mockReset();
    listEventsServiceMock.mockResolvedValue([]);
  });

  // Test health check endpoint - should return 200 with status 'ok'
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

  // Test request logging middleware - should mask sensitive fields like 'password'
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

  // Test 404 handler - should return consistent JSON error format
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

  // Test centralized error handler - should surface custom status codes and error details
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
