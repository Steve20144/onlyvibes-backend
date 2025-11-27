// src/tests/accounts.test.js
import request from 'supertest';
import app from '../app.js';
import { accounts } from '../data/accounts.js';

/**
 * Reset mock accounts before each test.
 * (Works when DB is not connected; harmless if DB is used instead.)
 */
beforeEach(() => {
  accounts.length = 0; // clear
  accounts.push(
    {
      id: 'user-1',
      username: 'partylover',
      email: 'user1@example.com',
      password: 'password1',
      role: 'user',
      isVerified: true,
      preferences: ['music', 'party'],
      venueDetails: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'venue-1',
      username: 'club-vibes',
      email: 'venue@example.com',
      password: 'venuepass',
      role: 'venue',
      isVerified: true,
      preferences: [],
      venueDetails: {
        location: 'Athens Center',
        taxIdentificationNumHashed: 123456,
        businessRegistrationNumHashed: 987654
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );
});

describe('Accounts API', () => {
  test('POST /accounts creates a new user account', async () => {
    const res = await request(app)
      .post('/accounts')
      .send({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'secret',
        role: 'user',
        preferences: ['music']
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.role).toBe('user');
    expect(res.body.message).toBe('Account created successfully');

    // No longer assert against underlying mock array;
    // we stay storage-agnostic (Mongo or mock).
  });

  test('POST /accounts fails with invalid email', async () => {
    const res = await request(app)
      .post('/accounts')
      .send({
        email: 'invalid-email',
        name: 'Bad User',
        password: 'secret',
        role: 'user'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid or missing email/i);
  });

  test('GET /accounts/:id returns an existing account', async () => {
    const res = await request(app).get('/accounts/user-1');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('user-1');
    expect(res.body.message).toBe('Account retrieved');
  });

  test('GET /accounts/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/accounts/unknown');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account not found');
  });

  test('PUT /accounts/:id updates an account', async () => {
    const res = await request(app)
      .put('/accounts/user-1')
      .send({ username: 'new-name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('new-name');
    expect(res.body.message).toBe('Account updated');
  });

  test('DELETE /accounts/:id removes an account', async () => {
    const res = await request(app).delete('/accounts/user-1');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account deleted');

    // Instead of checking the mock array directly, verify via API:
    const after = await request(app).get('/accounts/user-1');
    expect(after.statusCode).toBe(404);
    expect(after.body.success).toBe(false);
    expect(after.body.message).toBe('Account not found');
  });
});
