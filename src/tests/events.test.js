// src/tests/events.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Event from '../models/event.js';
import Account from '../models/account.js';
import createTestDb from './utils/testDb.js';

const testDb = createTestDb();
let creatorAccount;
let upcomingParty;
let yogaSession;

beforeAll(async () => {
  await testDb.connect();
});

afterAll(async () => {
  await testDb.disconnect();
});

beforeEach(async () => {
  await testDb.clearDatabase();

  creatorAccount = await Account.create({
    username: 'club-vibes',
    email: 'venue@example.com',
    password: 'venuepass',
    role: 'venue'
  });

  const creatorId = creatorAccount._id;

  upcomingParty = await Event.create({
    creatorId,
    title: 'Night Vibes Party',
    description: 'An unforgettable night with top DJs.',
    category: ['music'],
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    location: 'Athens',
    imageUrl: 'https://example.com/events/night-vibes.jpg'
  });

  yogaSession = await Event.create({
    creatorId,
    title: 'Morning Yoga in the Park',
    description: 'Relax & stretch at the national garden.',
    category: ['sports'],
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    location: 'Athens',
    imageUrl: 'https://example.com/events/yoga.jpg'
  });
});

describe('Events API', () => {
  test('GET /events returns persisted events', async () => {
    const res = await request(app).get('/events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((e) => e.id)).toEqual(
      expect.arrayContaining([
        upcomingParty._id.toString(),
        yogaSession._id.toString()
      ])
    );
    expect(res.body.message).toBe('Events retrieved');
  });

  test('GET /events filters by category', async () => {
    const res = await request(app).get('/events?category=music');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Night Vibes Party');
  });

  test('GET /events with filters that match nothing returns friendly message', async () => {
    const res = await request(app).get('/events?category=arts&location=Patra');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.message).toBe(
      'No events found. Try adjusting your filters.'
    );
  });

  test('GET /events/:id returns the requested event', async () => {
    const res = await request(app).get(`/events/${upcomingParty._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(upcomingParty._id.toString());
    expect(res.body.data.title).toBe('Night Vibes Party');
  });

  test('GET /events/:id with invalid id format returns 400', async () => {
    const res = await request(app).get('/events/1');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
  });

  test('GET /events/:id with missing event returns 404', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/events/${unknownId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });

  test('POST /events requires a valid creatorId', async () => {
    const baseEvent = {
      title: 'Art Gallery Opening',
      description: 'Local artists showcase.',
      categories: ['arts'],
      dateTime: new Date().toISOString(),
      location: 'Thessaloniki',
      imageUrl: 'https://example.com/events/art-gallery.jpg'
    };

    const resMissing = await request(app).post('/events').send(baseEvent);
    expect(resMissing.statusCode).toBe(400);
    expect(resMissing.body.message).toBe('A valid creatorId is required.');

    const resInvalid = await request(app)
      .post('/events')
      .send({ ...baseEvent, creatorId: 'not-an-object-id' });
    expect(resInvalid.statusCode).toBe(400);
    expect(resInvalid.body.message).toBe('A valid creatorId is required.');
  });

  test('POST /events persists a new event when payload is valid', async () => {
    const payload = {
      title: 'Art Gallery Opening',
      description: 'Local artists showcase.',
      categories: ['arts'],
      dateTime: new Date().toISOString(),
      location: 'Thessaloniki',
      imageUrl: 'https://example.com/events/art-gallery.jpg',
      creatorId: creatorAccount._id.toString()
    };

    const res = await request(app).post('/events').send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(payload.title);
    expect(res.body.message).toBe('Event created successfully');

    const eventsInDb = await Event.find({});
    expect(eventsInDb).toHaveLength(3);
  });

  test('PUT /events/:id updates editable fields', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({
        title: 'Night Vibes Reloaded',
        category: ['music', 'dance'],
        location: 'Thessaloniki'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Night Vibes Reloaded');
    expect(res.body.data.category).toEqual(['music', 'dance']);
  });

  test('PUT /events/:id validates malformed dateTime', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ dateTime: 'not-a-date' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(
      /dateTime must be a valid ISO date string/i
    );
  });

  test('DELETE /events/:id removes an existing event', async () => {
    const res = await request(app).delete(`/events/${yogaSession._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Event deleted successfully');

    const after = await Event.findById(yogaSession._id);
    expect(after).toBeNull();
  });

  test('DELETE /events/:id with invalid id returns 400', async () => {
    const res = await request(app).delete('/events/1');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
  });
});
