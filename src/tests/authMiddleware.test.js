// src/tests/authMiddleware.test.js
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret';
  }
});

// tiny helper to build fake req/res
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

describe('authenticate middleware', () => {
  test('returns 401 when Authorization header is missing', () => {
    const { req, res, next, getNextCalled } = createMock();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toBeDefined();
    expect(res.body.message).toMatch(/Authorization header missing/i);
    expect(getNextCalled()).toBe(false);
  });

  test('returns 401 when Authorization header format is invalid', () => {
    const { req, res, next, getNextCalled } = createMock('Token abc123');

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid Authorization header format/i);
    expect(getNextCalled()).toBe(false);
  });

  test('returns 401 when token is invalid', () => {
    const { req, res, next, getNextCalled } = createMock('Bearer invalidtoken');

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid or expired token/i);
    expect(getNextCalled()).toBe(false);
  });

  test('calls next and attaches user when token is valid', () => {
    const payload = { id: 'user-123', email: 'user@example.com', role: 'user' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const { req, res, next, getNextCalled } = createMock(`Bearer ${token}`);

    authenticate(req, res, next);

    // No error response
    expect(res.statusCode).toBe(0);
    expect(res.body).toBeNull();
    // Middleware chain continues
    expect(getNextCalled()).toBe(true);
    // User is attached
    expect(req.user).toMatchObject(payload);
  });
});
