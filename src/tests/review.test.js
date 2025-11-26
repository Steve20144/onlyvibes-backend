// tests/review.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import Event from '../models/event.js';
import Review from '../models/review.js';

let mongoServer;
let eventA;
let eventB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Review.deleteMany({});
  await Event.deleteMany({});

  const creatorId = new mongoose.Types.ObjectId();

  eventA = await Event.create({
    creatorId,
    title: 'Night Vibes Party',
    description: 'An unforgettable night with top DJs.',
    category: ['music'],
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    location: 'Athens',
    imageUrl: 'https://example.com/events/night-vibes.jpg'
  });

  eventB = await Event.create({
    creatorId,
    title: 'Morning Yoga in the Park',
    description: 'Relax & stretch at the national garden.',
    category: ['sports'],
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    location: 'Athens',
    imageUrl: 'https://example.com/events/yoga.jpg'
  });

  await Review.create([
    {
      eventId: eventA._id,
      accountId: 'user-1',
      rating: 5,
      comment: 'Amazing energy!',
      mediaUrls: []
    },
    {
      eventId: eventB._id,
      accountId: 'user-2',
      rating: 4,
      comment: 'Peaceful morning session.',
      mediaUrls: ['https://example.com/reviews/2/photo.jpg']
    }
  ]);
});

afterEach(async () => {
  await Review.deleteMany({});
  await Event.deleteMany({});
});

describe('Reviews API', () => {
  test('GET /events/:eventId/reviews returns reviews for event', async () => {
    const res = await request(app).get(`/events/${eventA._id}/reviews`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].rating).toBe(5);
    expect(res.body.message).toBe('Reviews retrieved');
  });

  test('POST /events/:eventId/reviews creates a review', async () => {
    const res = await request(app)
      .post(`/events/${eventA._id}/reviews`)
      .send({
        accountId: 'user-3',
        rating: 4,
        comment: 'Solid show',
        mediaUrls: []
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reviewId).toBeDefined();
    expect(res.body.message).toBe('Review submitted successfully');
  });

  test('POST /events/:eventId/reviews rejects duplicates', async () => {
    const res = await request(app)
      .post(`/events/${eventA._id}/reviews`)
      .send({
        accountId: 'user-1',
        rating: 5,
        comment: 'Another try'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'Review already exists for this event and account'
    );
  });

  test('GET /events/:eventId/reviews/:reviewId returns single review', async () => {
    const review = await Review.findOne({ eventId: eventB._id });

    const res = await request(app).get(
      `/events/${eventB._id}/reviews/${review._id}`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment).toBe('Peaceful morning session.');
  });

  test('PUT /events/:eventId/reviews/:reviewId updates rating', async () => {
    const review = await Review.findOne({ eventId: eventA._id });

    const res = await request(app)
      .put(`/events/${eventA._id}/reviews/${review._id}`)
      .send({ rating: 3, comment: 'Updating thoughts' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(3);
    expect(res.body.message).toBe('Review updated successfully');
  });

  test('DELETE /events/:eventId/reviews/:reviewId removes review', async () => {
    const review = await Review.findOne({ eventId: eventB._id });

    const res = await request(app).delete(
      `/events/${eventB._id}/reviews/${review._id}`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toBe('Review deleted successfully');

    const after = await request(app).get(`/events/${eventB._id}/reviews`);
    expect(after.body.data).toHaveLength(0);
  });

  test('GET /accounts/:accountId/reviewed-events returns summary', async () => {
    const latestReview = await Review.create({
      eventId: eventA._id,
      accountId: 'user-1',
      rating: 4,
      comment: 'Second visit'
    });

    const res = await request(app).get('/accounts/user-1/reviewed-events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].eventTitle).toBe('Night Vibes Party');
    expect(res.body.data[0].totalReviews).toBe(2);
    expect(res.body.data[0].reviewId).toBe(latestReview._id.toString());
  });
});
