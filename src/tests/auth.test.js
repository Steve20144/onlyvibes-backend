// src/tests/auth.test.js
import request from 'supertest';
import app from '../app.js';

describe('Auth API', () => {
  test('POST /auth/signup fails with missing fields', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        // password missing
        username: 'incomplete-user',
        email: 'no-password@example.com',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/username, email, and password are required/i);
  });
});
