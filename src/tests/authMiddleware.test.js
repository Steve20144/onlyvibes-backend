// src/tests/authMiddleware.test.js
/**
 * Unit tests for the authentication middleware.
 * 
 * This test suite validates:
 * - Authorization header presence and format (Bearer token)
 * - JWT token verification and decoding
 * - User attachment to request object on successful authentication
 * - Error responses for missing, malformed, or invalid tokens
 * 
 * Uses a custom mock helper to simulate Express req/res/next objects.
 */
import jwt from 'jsonwebtoken';
import Account from '../models/account.js';
import { authenticate } from '../middleware/auth.js';
import createTestDb from './utils/testDb.js';

// Initialize in-memory MongoDB test database
const testDb = createTestDb();

// Setup: Configure JWT secret and connect to test database
beforeAll(async () => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret';
  }

  await testDb.connect();
});

// Cleanup: Disconnect from test database
afterAll(async () => {
  await testDb.disconnect();
});

// Reset: Clear database before each test
beforeEach(async () => {
  await testDb.clearDatabase();
});

/**
 * Helper function to create mock Express req/res/next objects.
 * 
 * @param {string} authorizationHeader - Optional Authorization header value
 * @returns {Object} Mock objects and utility function to check if next() was called
 */
const createMock = (authorizationHeader) => {
  const req = { headers: {} };

  if (authorizationHeader) {
    req.headers['authorization'] = authorizationHeader;
  }

  const res = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  return { req, res, next, getNextCalled: () => nextCalled };
};

/**
 * Test suite for the authenticate middleware.
 * Validates JWT-based authentication and error handling.
 */
describe('authenticate middleware', () => {
  // Test missing Authorization header - should return 401
  test('returns 401 when Authorization header is missing', () => {
    const { req, res, next, getNextCalled } = createMock();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toBeDefined();
    expect(res.body.message).toMatch(/Authorization header missing/i);
    expect(getNextCalled()).toBe(false);
  });

  // Test Authorization header format - must be 'Bearer <token>'
  test('returns 401 when Authorization header format is invalid', () => {
    const { req, res, next, getNextCalled } = createMock('Token abc123');

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid Authorization header format/i);
    expect(getNextCalled()).toBe(false);
  });

  // Test JWT verification - should reject invalid or expired tokens
  test('returns 401 when token is invalid', () => {
    const { req, res, next, getNextCalled } = createMock('Bearer invalidtoken');

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid or expired token/i);
    expect(getNextCalled()).toBe(false);
  });

  // Test successful authentication - should attach user to req and call next()
  test('calls next and attaches user when token is valid', async () => {
    const account = await Account.create({
      username: 'jwt-user',
      email: 'jwt@example.com',
      password: 'test-pass',
      role: 'user'
    });

    const payload = {
      id: account._id.toString(),
      email: account.email,
      role: account.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    const { req, res, next, getNextCalled } = createMock(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.statusCode).toBe(0);
    expect(res.body).toBeNull();
    expect(getNextCalled()).toBe(true);
    expect(req.user.id).toBe(account._id.toString());
  });
});
