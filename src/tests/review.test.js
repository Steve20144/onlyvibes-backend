// src/tests/review.test.js
import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../app.js';
import Event from '../models/event.js';
import Review from '../models/review.js';
import dbHealth from '../utils/dbHealth.js';
import { createReviewService } from '../services/reviewService.js';
import { listReviewedEventsForAccount } from '../controllers/reviewController.js';
import createTestDb from './utils/testDb.js';

const testDb = createTestDb();
const mongoose = testDb.getMongoose();
let eventA;
let eventB;
let reviewA;
let reviewB;

const seedEventsAndReviews = async () => {
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

  [reviewA, reviewB] = await Review.create([
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
};

beforeAll(async () => {
  await testDb.connect();
});

afterAll(async () => {
  await testDb.disconnect();
});

beforeEach(async () => {
  await testDb.clearDatabase();
  await seedEventsAndReviews();
});

afterEach(() => {
  jest.restoreAllMocks();
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

  test('GET /events/:eventId/reviews returns friendly message when no reviews exist', async () => {
    await Review.deleteMany({ eventId: eventA._id });

    const res = await request(app).get(`/events/${eventA._id}/reviews`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe(
      'No reviews have been submitted for this event yet'
    );
  });

  test('GET /events/:eventId/reviews validates the event id parameter', async () => {
    const res = await request(app).get('/events/not-a-valid-id/reviews');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid event id');
  });

  test('GET /events/:eventId/reviews returns 404 when the event does not exist', async () => {
    const unknownEventId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/events/${unknownEventId}/reviews`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
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

  test('POST /events/:eventId/reviews requires a valid accountId', async () => {
    const res = await request(app)
      .post(`/events/${eventA._id}/reviews`)
      .send({
        rating: 5,
        comment: 'Missing account'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('A valid accountId is required');
  });

  test('POST /events/:eventId/reviews enforces rating boundaries', async () => {
    const res = await request(app)
      .post(`/events/${eventA._id}/reviews`)
      .send({
        accountId: 'user-8',
        rating: 6,
        comment: 'Too generous'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Rating must be between 1 and 5');
  });

  test('POST /events/:eventId/reviews returns 404 when event is missing', async () => {
    const unknownEventId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/events/${unknownEventId}/reviews`)
      .send({
        accountId: 'user-9',
        rating: 4,
        comment: 'Ghost event'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
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

  test('GET /events/:eventId/reviews/:reviewId validates the review id parameter', async () => {
    const res = await request(app).get(
      `/events/${eventB._id}/reviews/not-a-valid-id`
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid review id');
  });

  test('GET /events/:eventId/reviews/:reviewId returns 404 when review is missing', async () => {
    const missingReviewId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(
      `/events/${eventB._id}/reviews/${missingReviewId}`
    );

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Review not found');
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

  test('PUT /events/:eventId/reviews/:reviewId enforces rating boundaries', async () => {
    const res = await request(app)
      .put(`/events/${eventA._id}/reviews/${reviewA._id}`)
      .send({ rating: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Rating must be between 1 and 5');
  });

  test('PUT /events/:eventId/reviews/:reviewId returns 404 when review is missing', async () => {
    const missingReviewId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .put(`/events/${eventA._id}/reviews/${missingReviewId}`)
      .send({ rating: 4 });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Review not found');
  });

  test('PUT /events/:eventId/reviews/:reviewId replaces mediaUrls when provided as an array', async () => {
    const res = await request(app)
      .put(`/events/${eventA._id}/reviews/${reviewA._id}`)
      .send({ mediaUrls: ['https://example.com/new-media.jpg'], comment: 'New media' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mediaUrls).toEqual([
      'https://example.com/new-media.jpg'
    ]);

    const updatedDoc = await Review.findById(reviewA._id);
    expect(updatedDoc.mediaUrls).toEqual(['https://example.com/new-media.jpg']);
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

  test('DELETE /events/:eventId/reviews/:reviewId returns 404 when review is missing', async () => {
    const missingReviewId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).delete(
      `/events/${eventB._id}/reviews/${missingReviewId}`
    );

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Review not found');
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

  test('GET /accounts/:accountId/reviewed-events returns friendly message when no reviews exist', async () => {
    const res = await request(app).get('/accounts/new-user/reviewed-events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe('User has not reviewed any events yet');
  });

  test('listReviewedEventsForAccount requires the accountId parameter', async () => {
    const mockReq = { params: { accountId: '' } };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await listReviewedEventsForAccount(mockReq, mockRes, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'accountId parameter is required',
        statusCode: 400
      })
    );
  });
});

describe('reviewService edge cases', () => {
  test('createReviewService throws when the database is unavailable', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(false);

    await expect(
      createReviewService(eventA._id.toString(), {
        accountId: 'offline-user',
        rating: 4,
        comment: 'Should not persist'
      })
    ).rejects.toThrow('Database not available');
  });
});
