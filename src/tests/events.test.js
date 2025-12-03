// src/tests/events.test.js
import request from 'supertest';
import app from '../app.js';
import Event from '../models/event.js';
import Account from '../models/account.js';
import createTestDb from './utils/testDb.js';

const testDb = createTestDb();
const mongoose = testDb.getMongoose();
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

  test('GET /events filters by location substring (case-insensitive)', async () => {
    const res = await request(app).get('/events?location=ath');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.message).toBe('Events retrieved');
  });

  test('GET /events filters by category and location simultaneously', async () => {
    await Event.create({
      creatorId: creatorAccount._id,
      title: 'Thessaloniki Art Walk',
      description: 'Art-focused walking tour.',
      category: ['arts'],
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      location: 'Thessaloniki',
      imageUrl: 'https://example.com/events/art-walk.jpg'
    });

    const res = await request(app).get(
      '/events?category=arts&location=Thessaloniki'
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Thessaloniki Art Walk');
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

  test('GET /events with location filter and no results uses friendly message', async () => {
    const res = await request(app).get('/events?location=Patra');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe('No events found. Try adjusting your filters.');
  });

  test('GET /events/:id returns the requested event', async () => {
    const res = await request(app).get(`/events/${upcomingParty._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(upcomingParty._id.toString());
    expect(res.body.data.title).toBe('Night Vibes Party');
  });

  test('GET /events returns "No events found." when there are no events', async () => {
    await Event.deleteMany({});
    const res = await request(app).get('/events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe('No events found.');
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

  test('POST /events defaults missing description to empty string', async () => {
    const payload = {
      title: 'Silent Disco',
      categories: ['music'],
      dateTime: new Date().toISOString(),
      location: 'Patra',
      imageUrl: 'https://example.com/events/silent-disco.jpg',
      creatorId: creatorAccount._id.toString()
    };

    const res = await request(app).post('/events').send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.description).toBe('');

    const stored = await Event.findById(res.body.data.id);
    expect(stored.description).toBe('');
  });

  test('POST /events rejects missing title', async () => {
    const payload = {
      description: 'Missing title field',
      categories: ['arts'],
      dateTime: new Date().toISOString(),
      location: 'Patra',
      imageUrl: 'https://example.com/events/no-title.jpg',
      creatorId: creatorAccount._id.toString()
    };

    const res = await request(app).post('/events').send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/title: Path `title` is required/i);
  });

  test('POST /events rejects empty categories array', async () => {
    const payload = {
      title: 'Lonely Event',
      description: 'Should fail because categories are empty',
      categories: [],
      dateTime: new Date().toISOString(),
      location: 'Patra',
      creatorId: creatorAccount._id.toString()
    };

    const res = await request(app).post('/events').send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/At least one category is required/i);
  });

  test('POST /events normalizes category string input', async () => {
    const payload = {
      title: 'String Category Event',
      description: 'Should split comma separated values',
      category: 'music, dance',
      dateTime: new Date().toISOString(),
      location: 'Athens',
      creatorId: creatorAccount._id.toString()
    };

    const res = await request(app).post('/events').send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toEqual(['music', 'dance']);
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

  test('PUT /events/:id rejects empty payloads', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Provide at least one editable field to update.');
  });

  test('PUT /events/:id allows null description by storing empty string', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ description: null });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.description).toBe('');

    const updated = await Event.findById(upcomingParty._id);
    expect(updated.description).toBe('');
  });

  test('PUT /events/:id rejects non-string description values', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ description: 123 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Description must be a string.');
  });

  test('PUT /events/:id accepts comma-separated category strings', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ category: 'music, art ,  tech' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.category).toEqual(['music', 'art', 'tech']);
  });

  test('PUT /events/:id rejects invalid imageUrl types', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ imageUrl: { link: 'https://example.com/image.jpg' } });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('imageUrl must be a string.');
  });

  test('PUT /events/:id updates dateTime when provided a valid ISO string', async () => {
    const newDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ dateTime: newDate });

    expect(res.statusCode).toBe(200);
    expect(new Date(res.body.data.dateTime).toISOString()).toBe(newDate);

    const inDb = await Event.findById(upcomingParty._id);
    expect(inDb.dateTime.toISOString()).toBe(newDate);
  });

  test('PUT /events/:id rejects unknown fields', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ price: 10 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Field "price" cannot be updated.');
  });

  test('PUT /events/:id returns 404 for missing event', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/events/${unknownId}`)
      .send({ title: 'Ghost update' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });

  test('PUT /events/:id with invalid id returns 400', async () => {
    const res = await request(app)
      .put('/events/not-an-id')
      .send({ title: 'Should fail' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
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

  test('DELETE /events/:id returns 404 for missing event', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/events/${unknownId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });

  test('GET /events/liked/:userId returns placeholder data set', async () => {
    const res = await request(app).get(`/events/liked/${creatorAccount._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.message).toBe('User has not liked any events yet');
  });
});
