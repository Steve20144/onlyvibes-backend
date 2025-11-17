// tests/events.test.js
import request from 'supertest';
import app from '../app.js';
import { events } from '../data/events.js';

/**
 * Reset mock events before each test.
 */
beforeEach(() => {
  events.length = 0;
  events.push(
    {
      eventId: 1,
      creatorId: 'venue-1',
      title: 'Night Vibes Party',
      description: 'An unforgettable night with top DJs.',
      category: 'music',
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      location: 'Athens',
      latitude: 37.9838,
      longitude: 23.7275,
      imageUrl: 'https://example.com/events/night-vibes.jpg',
      isCancelled: false
    },
    {
      eventId: 2,
      creatorId: 'venue-1',
      title: 'Morning Yoga in the Park',
      description: 'Relax & stretch at the national garden.',
      category: 'sports',
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      location: 'Athens',
      latitude: 37.9715,
      longitude: 23.7267,
      imageUrl: 'https://example.com/events/yoga.jpg',
      isCancelled: false
    }
  );
});

describe('Events API', () => {
  test('GET /events returns all events when no filters', async () => {
    const res = await request(app).get('/events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.message).toBe('Events retrieved');
  });

  test('GET /events applies category filter and returns events', async () => {
    const res = await request(app).get('/events?category=music');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].category).toBe('music');
  });

  test('GET /events with filters that match nothing returns proper message', async () => {
    const res = await request(app).get('/events?category=arts');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.message).toBe(
      'No events found. Try adjusting your filters.'
    );
  });

  test('GET /events/:id returns a single event', async () => {
    const res = await request(app).get('/events/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eventId).toBe(1);
    expect(res.body.message).toBe('Event retrieved');
  });

  test('GET /events/:id returns 404 for missing event', async () => {
    const res = await request(app).get('/events/999');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });

  test('POST /events creates a new event', async () => {
    const newEvent = {
      title: 'Art Gallery Opening',
      description: 'Local artists showcase.',
      category: 'arts',
      dateTime: new Date().toISOString(),
      location: 'Thessaloniki',
      latitude: 40.6401,
      longitude: 22.9444
    };

    const res = await request(app).post('/events').send({
      ...newEvent,
      creatorId: 'venue-1'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('eventId');
    expect(res.body.data.title).toBe('Art Gallery Opening');
    expect(res.body.message).toBe('Event created successfully');
  });

  test('PUT /events/:id updates an existing event', async () => {
    const res = await request(app)
      .put('/events/1')
      .send({ title: 'Night Vibes Party – Updated' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Night Vibes Party – Updated');
    expect(res.body.message).toBe('Event updated successfully');
  });

  test('PUT /events/:id updates multiple fields with validation', async () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .put('/events/2')
      .send({
        title: 'Morning Yoga – Sunset Edition',
        location: 'Thessaloniki',
        dateTime: nextWeek,
        isCancelled: true
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Morning Yoga – Sunset Edition');
    expect(res.body.data.location).toBe('Thessaloniki');
    expect(new Date(res.body.data.dateTime).toISOString()).toBe(new Date(nextWeek).toISOString());
    expect(res.body.data.isCancelled).toBe(true);
  });

  test('PUT /events/:id rejects payload without editable fields', async () => {
    const res = await request(app)
      .put('/events/1')
      .send({ creatorId: 'venue-2' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot be updated|Provide at least one editable field/i);
  });

  test('PUT /events/:id validates malformed dateTime', async () => {
    const res = await request(app)
      .put('/events/1')
      .send({ dateTime: 'not-a-date' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/dateTime must be a valid ISO date string/i);
  });

  test('DELETE /events/:id removes an event', async () => {
  const res = await request(app).delete('/events/1');

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.message).toBe('Event deleted successfully');
  expect(events.find((e) => e.eventId === 1)).toBeUndefined();
});

});
