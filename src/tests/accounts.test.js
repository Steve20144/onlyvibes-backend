// src/tests/accounts.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Account from '../models/account.js';
import createTestDb from './utils/testDb.js';

const testDb = createTestDb();
let baseAccount;

beforeAll(async () => {
  await testDb.connect();
});

afterAll(async () => {
  await testDb.disconnect();
});

beforeEach(async () => {
  await testDb.clearDatabase();

  baseAccount = await Account.create({
    username: 'partylover',
    email: 'user1@example.com',
    password: 'password1',
    role: 'user',
    isVerified: true,
    preferences: ['music', 'party'],
    venueDetails: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
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
    const res = await request(app).get(`/accounts/${baseAccount._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(baseAccount._id.toString());
    expect(res.body.message).toBe('Account retrieved');
  });

  test('GET /accounts/:id returns 404 for unknown id', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/accounts/${unknownId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account not found');
  });

  test('PUT /accounts/:id updates an account', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ username: 'new-name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('new-name');
    expect(res.body.message).toBe('Account updated');
  });

  test('DELETE /accounts/:id removes an account', async () => {
    const res = await request(app).delete(`/accounts/${baseAccount._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account deleted');

    // Instead of checking the mock array directly, verify via API:
    const after = await request(app).get(`/accounts/${baseAccount._id}`);
    expect(after.statusCode).toBe(404);
    expect(after.body.success).toBe(false);
    expect(after.body.message).toBe('Account not found');
  });
});
