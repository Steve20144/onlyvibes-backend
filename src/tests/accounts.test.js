// src/tests/accounts.test.js
/**
 * Integration tests for the Accounts API endpoints.
 * 
 * This test suite validates:
 * - Account creation (POST /accounts) with various roles and validation rules
 * - Account retrieval (GET /accounts/:id) for existing and non-existent accounts
 * - Account updates (PUT /accounts/:id) with field validation
 * - Account deletion (DELETE /accounts/:id)
 * - Database availability handling
 * - Service layer error handling and document normalization
 */
import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../app.js';
import Account from '../models/account.js';
import {
  updateAccountService,
  deleteAccountService
} from '../services/accountService.js';
import dbHealth from '../utils/dbHealth.js';
import createTestDb from './utils/testDb.js';

// Initialize in-memory MongoDB test database
const testDb = createTestDb();
const mongoose = testDb.getMongoose();

// Base account used across multiple tests
let baseAccount;

/**
 * Seeds a base user account for test scenarios.
 * Creates a verified user with sample preferences.
 */
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

// Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  await testDb.connect();
});

// Disconnect from in-memory MongoDB after all tests
afterAll(async () => {
  await testDb.disconnect();
});

// Clear database and seed base account before each test
beforeEach(async () => {
  await testDb.clearDatabase();

  await seedBaseAccount();
});

// Restore all mocked functions after each test
afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Test suite for Accounts API endpoints.
 * Covers CRUD operations and validation rules for user and venue accounts.
 */
describe('Accounts API', () => {
  // Test successful account creation with valid data
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

  // Test email validation - should reject malformed email addresses
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

  // Test required field validation - name is mandatory
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

  // Test password length validation - minimum 4 characters required
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

  // Test role validation - must be either 'user' or 'venue'
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

  // Test venue-specific account creation with additional venue details
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

  // Test uniqueness constraint - email addresses must be unique
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

  // Test successful retrieval of an existing account by ID
  test('GET /accounts/:id returns an existing account', async () => {
    const res = await request(app).get(`/accounts/${baseAccount._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(baseAccount._id.toString());
    expect(res.body.message).toBe('Account retrieved');
  });

  // Test 404 response when account ID doesn't exist
  test('GET /accounts/:id returns 404 for unknown id', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/accounts/${unknownId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account not found');
  });

  // Test successful account update with valid fields
  test('PUT /accounts/:id updates an account', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ username: 'new-name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('new-name');
    expect(res.body.message).toBe('Account updated');
  });

  // Test successful account deletion and verify removal from database
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

  // Test 404 response when updating non-existent account
  test('PUT /accounts/:id returns 404 when account is missing', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/accounts/${unknownId}`)
      .send({ username: 'ghost' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account not found');
  });

  // Test validation - at least one field required for updates
  test('PUT /accounts/:id fails with empty body', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Provide at least one field to update.');
  });

  // Test field whitelist - unknown fields should be rejected
  test('PUT /accounts/:id rejects unknown fields', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ favoriteFood: 'pizza' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Field "favoriteFood" cannot be updated.');
  });

  // Test username length validation - minimum 2 characters
  test('PUT /accounts/:id enforces username length', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ username: 'a' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('username must be at least 2 characters.');
  });

  // Test preferences field type - must be an array of strings
  test('PUT /accounts/:id validates preferences array', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ preferences: 'music' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('preferences must be an array of strings');
  });

  // Test venueDetails field type - must be an object
  test('PUT /accounts/:id validates venueDetails object', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ venueDetails: 'Athens' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('venueDetails must be an object');
  });

  // Test isVerified field type - must be a boolean
  test('PUT /accounts/:id validates isVerified type', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ isVerified: 'yes' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('isVerified must be a boolean');
  });

  // Test request body type - must be a JSON object, not an array
  test('PUT /accounts/:id rejects non-object payloads', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send(['not-an-object']);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Request body must be a JSON object.');
  });

  // Test role update validation - only 'user' or 'venue' allowed
  test('PUT /accounts/:id rejects invalid role updates', async () => {
    const res = await request(app)
      .put(`/accounts/${baseAccount._id}`)
      .send({ role: 'admin' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Role must be "user" or "venue"');
  });

  // Test 404 response when deleting non-existent account
  test('DELETE /accounts/:id returns 404 when account is missing', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/accounts/${unknownId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account not found');
  });

  // Test database health check - should return 503 when DB is down
  test('POST /accounts returns 503 when database is unavailable', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(false);

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
  });

  // Test service layer error propagation - database errors should bubble up
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

  // Test document normalization - should convert _id to id and remove __v
  test('updateAccountService normalizes the updated document on success', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(true);

    const updatedDoc = {
      _id: new mongoose.Types.ObjectId(),
      username: 'patched-name',
      __v: 0
    };
    updatedDoc.toObject = jest.fn().mockReturnValue({
      _id: updatedDoc._id,
      username: 'patched-name',
      __v: 0
    });

    const spy = jest
      .spyOn(Account, 'findByIdAndUpdate')
      .mockResolvedValue(updatedDoc);

    const result = await updateAccountService(updatedDoc._id.toString(), {
      username: 'patched-name'
    });

    expect(spy).toHaveBeenCalledWith(
      updatedDoc._id.toString(),
      expect.objectContaining({
        username: 'patched-name',
        updatedAt: expect.any(Date)
      }),
      { new: true, runValidators: true }
    );
    expect(updatedDoc.toObject).toHaveBeenCalled();
    expect(result).toMatchObject({
      username: 'patched-name',
      id: expect.any(String)
    });
    expect(result).not.toHaveProperty('__v');
  });

  // Test delete service error propagation
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

  // Test delete service return values - true when deleted, false when not found
  test('deleteAccountService returns true when a document is deleted and false otherwise', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(true);
    const doc = { _id: new mongoose.Types.ObjectId() };
    const spy = jest
      .spyOn(Account, 'findByIdAndDelete')
      .mockResolvedValueOnce(doc)
      .mockResolvedValueOnce(null);

    const success = await deleteAccountService(doc._id.toString());
    const failure = await deleteAccountService(doc._id.toString());

    expect(success).toBe(true);
    expect(failure).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
