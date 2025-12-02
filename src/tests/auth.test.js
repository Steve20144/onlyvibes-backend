// src/tests/auth.test.js
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../app.js';
import Account from '../models/account.js';
import createTestDb from './utils/testDb.js';

const testDb = createTestDb();

beforeAll(async () => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret';
  }

  await testDb.connect();
});

afterAll(async () => {
  await testDb.disconnect();
});

beforeEach(async () => {
  await testDb.clearDatabase();
});

describe('Auth API', () => {
  test('POST /auth/signup fails with missing fields', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        // password missing
        username: 'incomplete-user',
        email: 'no-password@example.com'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/username, email, and password are required/i);
  });

  test('POST /auth/signup persists user and returns JWT', async () => {
    const payload = {
      username: 'new-user',
      email: 'new-user@example.com',
      password: 'StrongPass123'
    };

    const res = await request(app).post('/auth/signup').send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Signup successful');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      username: payload.username,
      email: payload.email,
      role: 'user'
    });

    const account = await Account.findOne({ email: payload.email });
    expect(account).toBeTruthy();
    expect(account.username).toBe(payload.username);
  });

  test('POST /auth/signup rejects duplicate emails', async () => {
    await Account.create({
      username: 'existing',
      email: 'exists@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'user'
    });

    const res = await request(app).post('/auth/signup').send({
      username: 'other',
      email: 'exists@example.com',
      password: 'AnotherPass123'
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Email already in use');
  });

  test('POST /auth/login authenticates valid credentials', async () => {
    const password = 'Password123!';
    await Account.create({
      username: 'login-user',
      email: 'login@example.com',
      password: await bcrypt.hash(password, 10),
      role: 'user'
    });

    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe('login@example.com');
  });

  test('POST /auth/login rejects invalid credentials', async () => {
    await Account.create({
      username: 'login-user',
      email: 'login@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'user'
    });

    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword!'
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});
