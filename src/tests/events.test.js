// src/tests/events.test.js
/**
 * Integration tests for Events API endpoints.
 * 
 * This test suite validates:
 * - Event listing (GET /events) with category and location filters
 * - Single event retrieval (GET /events/:id)
 * - Event creation (POST /events) with validation
 * - Event updates (PUT /events/:id) with field sanitization
 * - Event deletion (DELETE /events/:id)
 * - Liked events endpoint (GET /events/liked/:userId)
 * - Full database integration with seeded test data
 */
import request from 'supertest';
import app from '../app.js';
import Event from '../models/event.js';
import Account from '../models/account.js';
import createTestDb from './utils/testDb.js';

// Initialize in-memory MongoDB test database
const testDb = createTestDb();
const mongoose = testDb.getMongoose();

// Test fixtures - populated in beforeEach
let creatorAccount;  // Venue account that creates events
let upcomingParty;   // Sample music event
let yogaSession;     // Sample sports event

// Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  await testDb.connect();
});

// Disconnect from in-memory MongoDB after all tests
afterAll(async () => {
  await testDb.disconnect();
});

// Setup: Clear database and seed test data before each test
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

/**
 * Test suite for Events API endpoints.
 * Covers full CRUD operations with database integration.
 */
describe('Events API', () => {
  // Test basic event listing without filters
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

  // Test category filtering
  test('GET /events filters by category', async () => {
    const res = await request(app).get('/events?category=music');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Night Vibes Party');
  });

  // Test location filtering with case-insensitive substring matching
  test('GET /events filters by location substring (case-insensitive)', async () => {
    const res = await request(app).get('/events?location=ath');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.message).toBe('Events retrieved');
  });

  // Test combining multiple filters (category AND location)
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

  // Test user-friendly messaging when filters match nothing
  test('GET /events with filters that match nothing returns friendly message', async () => {
    const res = await request(app).get('/events?category=arts&location=Patra');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.message).toBe(
      'No events found. Try adjusting your filters.'
    );
  });

  // Test friendly message with location filter and no results
  test('GET /events with location filter and no results uses friendly message', async () => {
    const res = await request(app).get('/events?location=Patra');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe('No events found. Try adjusting your filters.');
  });

  // Test single event retrieval by ID
  test('GET /events/:id returns the requested event', async () => {
    const res = await request(app).get(`/events/${upcomingParty._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(upcomingParty._id.toString());
    expect(res.body.data.title).toBe('Night Vibes Party');
  });

  // Test empty database message
  test('GET /events returns "No events found." when there are no events', async () => {
    await Event.deleteMany({});
    const res = await request(app).get('/events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe('No events found.');
  });

  // Test ID format validation - should reject malformed IDs
  test('GET /events/:id with invalid id format returns 400', async () => {
    const res = await request(app).get('/events/1');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
  });

  // Test 404 response for non-existent event ID
  test('GET /events/:id with missing event returns 404', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/events/${unknownId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });

  // Test creatorId requirement for event creation
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

  // Test successful event creation with valid payload
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

  // Test default value handling - missing description should default to empty string
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

  // Test required field validation - title is mandatory
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

  // Test categories validation - at least one category required
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

  // Test category input normalization - comma-separated strings converted to array
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

  // Test successful event update with multiple fields
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

  // Test dateTime validation - must be valid ISO date string
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

  // Test empty update validation - at least one field required
  test('PUT /events/:id rejects empty payloads', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Provide at least one editable field to update.');
  });

  // Test null description handling - should convert to empty string
  test('PUT /events/:id allows null description by storing empty string', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ description: null });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.description).toBe('');

    const updated = await Event.findById(upcomingParty._id);
    expect(updated.description).toBe('');
  });

  // Test description type validation - must be string or null
  test('PUT /events/:id rejects non-string description values', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ description: 123 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Description must be a string.');
  });

  // Test category update with comma-separated string input
  test('PUT /events/:id accepts comma-separated category strings', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ category: 'music, art ,  tech' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.category).toEqual(['music', 'art', 'tech']);
  });

  // Test imageUrl type validation - must be string
  test('PUT /events/:id rejects invalid imageUrl types', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ imageUrl: { link: 'https://example.com/image.jpg' } });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('imageUrl must be a string.');
  });

  // Test dateTime update with valid ISO string
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

  // Test field whitelist - unknown fields should be rejected
  test('PUT /events/:id rejects unknown fields', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ price: 10 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Field "price" cannot be updated.');
  });

  // Test title length validation - minimum 3 characters after trimming
  test('PUT /events/:id enforces trimmed title length', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ title: '  ab ' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Title must be a string with at least 3 characters.');
  });

  // Test category array validation - all elements must be strings
  test('PUT /events/:id rejects category arrays with non-string entries', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ category: ['music', 42] });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('category must be a non-empty array of strings.');
  });

  // Test location length validation - minimum 2 characters
  test('PUT /events/:id enforces location length requirements', async () => {
    const res = await request(app)
      .put(`/events/${upcomingParty._id}`)
      .send({ location: 'A' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Location must be a string with at least 2 characters.');
  });

  // Test 404 when updating non-existent event
  test('PUT /events/:id returns 404 for missing event', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/events/${unknownId}`)
      .send({ title: 'Ghost update' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });

  // Test ID validation on update - should reject malformed IDs
  test('PUT /events/:id with invalid id returns 400', async () => {
    const res = await request(app)
      .put('/events/not-an-id')
      .send({ title: 'Should fail' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
  });

  // Test successful event deletion and database verification
  test('DELETE /events/:id removes an existing event', async () => {
    const res = await request(app).delete(`/events/${yogaSession._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Event deleted successfully');

    const after = await Event.findById(yogaSession._id);
    expect(after).toBeNull();
  });

  // Test ID validation on delete
  test('DELETE /events/:id with invalid id returns 400', async () => {
    const res = await request(app).delete('/events/1');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
  });

  // Test 404 when deleting non-existent event
  test('DELETE /events/:id returns 404 for missing event', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/events/${unknownId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });

  // Test liked events endpoint (placeholder/stub implementation)
  test('GET /events/liked/:userId returns placeholder data set', async () => {
    const res = await request(app).get(`/events/liked/${creatorAccount._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.message).toBe('User has not liked any events yet');
  });
});
