// src/tests/review.test.js
import request from 'supertest';
import app from '../app.js';
import { events } from '../data/events.js';
import { reviews, resetReviewIdCounter } from '../data/reviews.js';

beforeEach(() => {
  // Reset events snapshot
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

  // Reset reviews snapshot
  reviews.length = 0;
  reviews.push(
    {
      reviewId: 1,
      eventId: 1,
      userId: 'user-1',
      rating: 5,
      comment: 'Amazing energy!',
      mediaUrls: [],
      createdAt: new Date(Date.now() - 10000),
      updatedAt: new Date(Date.now() - 9000)
    },
    {
      reviewId: 2,
      eventId: 2,
      userId: 'user-2',
      rating: 4,
      comment: 'Peaceful morning session.',
      mediaUrls: ['https://example.com/reviews/2/photo.jpg'],
      createdAt: new Date(Date.now() - 8000),
      updatedAt: new Date(Date.now() - 7000)
    }
  );
  resetReviewIdCounter(reviews.length);
});

describe('Reviews API', () => {
  test('GET /events/:eventId/reviews returns reviews for event', async () => {
    const res = await request(app).get('/events/1/reviews');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].rating).toBe(5);
    expect(res.body.message).toBe('Reviews retrieved');
  });

  test('POST /events/:eventId/reviews creates a review', async () => {
    const res = await request(app).post('/events/1/reviews').send({
      userId: 'user-3',
      rating: 4,
      comment: 'Solid show',
      mediaUrls: []
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reviewId).toBe(3);
    expect(res.body.message).toBe('Review submitted successfully');
  });

  test('POST /events/:eventId/reviews rejects duplicates', async () => {
    const res = await request(app).post('/events/1/reviews').send({
      userId: 'user-1',
      rating: 5,
      comment: 'Another try'
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Review already exists for this event and user');
  });

  test('GET /events/:eventId/reviews/:reviewId returns single review', async () => {
    const res = await request(app).get('/events/2/reviews/2');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment).toBe('Peaceful morning session.');
  });

  test('PUT /events/:eventId/reviews/:reviewId updates rating', async () => {
    const res = await request(app)
      .put('/events/1/reviews/1')
      .send({ rating: 3, comment: 'Updating thoughts' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(3);
    expect(res.body.message).toBe('Review updated successfully');
  });

  test('DELETE /events/:eventId/reviews/:reviewId removes review', async () => {
    const res = await request(app).delete('/events/2/reviews/2');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toBe('Review deleted successfully');

    const after = await request(app).get('/events/2/reviews');
    expect(after.body.data.find((review) => review.reviewId === 2)).toBeUndefined();
  });

  test('GET /users/:userId/reviewed-events returns summary', async () => {
    const res = await request(app).get('/users/user-1/reviewed-events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].eventTitle).toBe('Night Vibes Party');
  });
});
