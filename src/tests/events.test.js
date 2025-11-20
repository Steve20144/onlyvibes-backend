// src/tests/events.test.js
import request from 'supertest';
import app from '../app.js';

// Any valid MongoDB ObjectId string (we don't actually hit a real DB here)
const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';

describe('Events API', () => {
  test('GET /events returns empty list when DB has no events / not connected', async () => {
    const res = await request(app).get('/events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.message).toBe('No events found.');
  });

  test('GET /events with category filter returns empty list and filter message', async () => {
    const res = await request(app).get('/events?category=music');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.message).toBe(
      'No events found. Try adjusting your filters.'
    );
  });

  test('GET /events with filters that match nothing returns proper message', async () => {
    const res = await request(app).get('/events?category=arts&location=Athens');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.message).toBe(
      'No events found. Try adjusting your filters.'
    );
  });

  test('GET /events/:id with invalid id format returns 400', async () => {
    const res = await request(app).get('/events/1'); // not a valid ObjectId

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
  });

  test('GET /events/:id with valid ObjectId but missing event returns 404', async () => {
    const res = await request(app).get(`/events/${VALID_OBJECT_ID}`);

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

    // Missing creatorId
    const resMissing = await request(app)
      .post('/events')
      .send(baseEvent);

    expect(resMissing.statusCode).toBe(400);
    expect(resMissing.body.success).toBe(false);
    expect(resMissing.body.message).toBe('A valid creatorId is required.');

    // Invalid creatorId format
    const resInvalid = await request(app)
      .post('/events')
      .send({
        ...baseEvent,
        creatorId: 'not-an-object-id'
      });

    expect(resInvalid.statusCode).toBe(400);
    expect(resInvalid.body.success).toBe(false);
    expect(resInvalid.body.message).toBe('A valid creatorId is required.');
  });

  test('POST /events with valid payload but no DB connection returns 500', async () => {
    const newEvent = {
      title: 'Art Gallery Opening',
      description: 'Local artists showcase.',
      categories: ['arts'],
      dateTime: new Date().toISOString(),
      location: 'Thessaloniki',
      imageUrl: 'https://example.com/events/art-gallery.jpg',
      creatorId: VALID_OBJECT_ID
    };

    const res = await request(app).post('/events').send(newEvent);

    // With the current service implementation, this fails because Mongo is not connected
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Database not available');
  });

  test('PUT /events/:id rejects payload without editable fields', async () => {
    const res = await request(app)
      .put(`/events/${VALID_OBJECT_ID}`)
      .send({ creatorId: VALID_OBJECT_ID }); // not editable

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(
      /Field "creatorId" cannot be updated|Provide at least one editable field/i
    );
  });

  test('PUT /events/:id validates malformed dateTime', async () => {
    const res = await request(app)
      .put(`/events/${VALID_OBJECT_ID}`)
      .send({ dateTime: 'not-a-date' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(
      /dateTime must be a valid ISO date string/i
    );
  });

  test('DELETE /events/:id with invalid id returns 400', async () => {
    const res = await request(app).delete('/events/1');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
  });

  test('DELETE /events/:id with valid id but no DB connection returns 404', async () => {
    const res = await request(app).delete(`/events/${VALID_OBJECT_ID}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });
});
