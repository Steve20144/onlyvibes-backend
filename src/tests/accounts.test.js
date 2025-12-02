// src/tests/accounts.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import app from '../app.js';
import Account from '../models/account.js';
import {
  updateAccountService,
  deleteAccountService
} from '../services/accountService.js';
import createTestDb from './utils/testDb.js';

const testDb = createTestDb();
let baseAccount;
const seedBaseAccount = async () => {
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
};

beforeAll(async () => {
  await testDb.connect();
});

afterAll(async () => {
  await testDb.disconnect();
});

beforeEach(async () => {
  await testDb.clearDatabase();

  await seedBaseAccount();
});

afterEach(() => {
  jest.restoreAllMocks();
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

    // Data is persisted in the in-memory MongoDB instance.
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

  test('POST /accounts fails with missing name', async () => {
    const res = await request(app)
      .post('/accounts')
      .send({
        email: 'noname@example.com',
        password: 'secret',
        role: 'user'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid or missing name/i);
  });

  test('POST /accounts fails when password is shorter than 4 chars', async () => {
    const res = await request(app)
      .post('/accounts')
      .send({
        email: 'shortpass@example.com',
        name: 'Short Pass',
        password: '123',
        role: 'user'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Password must be at least 4 characters/i);
  });

  test('POST /accounts fails with missing or invalid role', async () => {
    const resMissing = await request(app)
      .post('/accounts')
      .send({
        email: 'norole@example.com',
        name: 'No Role',
        password: 'secret'
      });

    expect(resMissing.statusCode).toBe(400);
    expect(resMissing.body.message).toMatch(/Role must be "user" or "venue"/i);

    const resInvalid = await request(app)
      .post('/accounts')
      .send({
        email: 'invalidrole@example.com',
        name: 'Invalid Role',
        password: 'secret',
        role: 'admin'
      });

    expect(resInvalid.statusCode).toBe(400);
    expect(resInvalid.body.message).toMatch(/Role must be "user" or "venue"/i);
  });

  test('POST /accounts creates a venue account with venue details', async () => {
    const venuePayload = {
      email: 'venue-new@example.com',
      name: 'New Venue',
      password: 'venuepass',
      role: 'venue',
      venueDetails: {
        location: 'Athens Center',
        taxIdentificationNumHashed: 123456,
        businessRegistrationNumHashed: 987654
      }
    };

    const res = await request(app).post('/accounts').send(venuePayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('venue');
    expect(res.body.data.isVerified).toBe(true);
    expect(res.body.data.venueDetails).toMatchObject(venuePayload.venueDetails);
  });

  test('POST /accounts rejects duplicate emails', async () => {
    const res = await request(app)
      .post('/accounts')
      .send({
        email: baseAccount.email,
        name: 'Duplicate Email',
        password: 'secret',
        role: 'user'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already in use');
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

    const after = await request(app).get(`/accounts/${baseAccount._id}`);
    expect(after.statusCode).toBe(404);
    expect(after.body.success).toBe(false);
    expect(after.body.message).toBe('Account not found');
  });

  test('PUT /accounts/:id returns 404 when account is missing', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/accounts/${unknownId}`)
      .send({ username: 'ghost' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account not found');
  });

  test('PUT /accounts/:id fails with empty body', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Provide at least one field to update.');
  });

  test('PUT /accounts/:id rejects unknown fields', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ favoriteFood: 'pizza' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Field "favoriteFood" cannot be updated.');
  });

  test('PUT /accounts/:id enforces username length', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ username: 'a' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('username must be at least 2 characters.');
  });

  test('PUT /accounts/:id validates preferences array', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ preferences: 'music' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('preferences must be an array of strings');
  });

  test('PUT /accounts/:id validates venueDetails object', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ venueDetails: 'Athens' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('venueDetails must be an object');
  });

  test('PUT /accounts/:id validates isVerified type', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ isVerified: 'yes' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('isVerified must be a boolean');
  });

  test('PUT /accounts/:id rejects non-object payloads', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send(['not-an-object']);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Request body must be a JSON object.');
  });

  test('PUT /accounts/:id rejects invalid role updates', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ role: 'admin' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Role must be "user" or "venue"');
  });

  test('DELETE /accounts/:id returns 404 when account is missing', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/accounts/${unknownId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account not found');
  });

  test('POST /accounts returns 503 when database is unavailable', async () => {
    await mongoose.disconnect();

    const res = await request(app)
      .post('/accounts')
      .send({
        email: 'dbdown@example.com',
        name: 'DB Down',
        password: 'secret',
        role: 'user'
      });

    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Database not available');

    await mongoose.connect(testDb.getUri());
    await testDb.clearDatabase();
    await seedBaseAccount();
  });

  test('updateAccountService surfaces database errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spy = jest
      .spyOn(Account, 'findByIdAndUpdate')
      .mockImplementation(() => {
        throw new Error('test-update-error');
      });

    await expect(
      updateAccountService(baseAccount._id.toString(), { username: 'retry-me' })
    ).rejects.toThrow('test-update-error');

    expect(spy).toHaveBeenCalledWith(
      baseAccount._id.toString(),
      expect.objectContaining({ username: 'retry-me' }),
      expect.objectContaining({ new: true, runValidators: true })
    );

    consoleSpy.mockRestore();
  });

  test('deleteAccountService surfaces database errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spy = jest.spyOn(Account, 'findByIdAndDelete').mockImplementation(() => {
      throw new Error('test-delete-error');
    });

    await expect(deleteAccountService(baseAccount._id.toString())).rejects.toThrow(
      'test-delete-error'
    );

    expect(spy).toHaveBeenCalledWith(baseAccount._id.toString());

    consoleSpy.mockRestore();
  });
});
