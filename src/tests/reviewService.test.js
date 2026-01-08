// src/tests/reviewService.test.js
/**
 * Unit tests for review service layer.
 * 
 * This test suite validates:
 * - Database connectivity checks and graceful degradation
 * - CRUD operations for reviews with proper error handling
 * - Document normalization and field defaults
 * - Event existence validation
 * - Duplicate review detection
 * - Reviewed events aggregation with missing event handling
 * 
 * Uses mocked Review and Event models to isolate service logic.
 */
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import Review from '../models/review.js';
import Event from '../models/event.js';
import dbHealth from '../utils/dbHealth.js';
import {
  createReviewService,
  deleteReviewService,
  ensureEventExistsService,
  getReviewByEventAndAccountService,
  getReviewByIdService,
  getReviewedEventsByAccountService,
  getReviewsByEventIdService,
  updateReviewService
} from '../services/reviewService.js';

/**
 * Creates a mock Review document with toObject() method.
 * Used to simulate Mongoose documents in tests.
 */
const createMockReviewDoc = (overrides = {}) => {
  const base = {
    _id: overrides._id ?? new mongoose.Types.ObjectId(),
    eventId: overrides.eventId ?? new mongoose.Types.ObjectId(),
    accountId: 'user-1',
    rating: 4,
    comment: 'Solid vibes',
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  };

  const doc = { ...base, ...overrides };

  return {
    ...doc,
    toObject: jest.fn().mockReturnValue({ ...doc })
  };
};

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Test suite for deleteReviewService.
 * Validates deletion logic and return values.
 */
describe('deleteReviewService', () => {
  // Test database availability check
  test('returns false when the database is unavailable', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(false);
    const spy = jest.spyOn(Review, 'findOneAndDelete');

    const result = await deleteReviewService('event-x', 'review-y');

    expect(result).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  test('returns true only when a document is deleted', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(true);
    const deleteSpy = jest
      .spyOn(Review, 'findOneAndDelete')
      .mockResolvedValueOnce({ _id: 'doc-1' })
      .mockResolvedValueOnce(null);

    const success = await deleteReviewService('event-a', 'review-a');
    const failure = await deleteReviewService('event-a', 'review-b');

    expect(success).toBe(true);
    expect(failure).toBe(false);
    expect(deleteSpy).toHaveBeenCalledTimes(2);
  });
});

/**
 * Test suite for getReviewedEventsByAccountService.
 * Validates review aggregation and event metadata joining.
 */
describe('getReviewedEventsByAccountService', () => {
  /**
   * Helper to mock Review.find().sort() chain.
   * Returns a jest mock for the sort method.
   */
  const mockSortedFind = (docs) => {
    const sortMock = jest.fn().mockResolvedValue(docs);
    jest.spyOn(Review, 'find').mockReturnValue({ sort: sortMock });
    return sortMock;
  };

  /**
   * Nested test suite for database disconnection scenarios.
   * Tests that all service methods handle offline state gracefully.
   */
  describe('database guard clauses', () => {
    const blockedCalls = [
      {
        name: 'ensureEventExistsService',
        fn: () => ensureEventExistsService('event-1'),
        expected: null,
        spyFactory: () => jest.spyOn(Event, 'findById')
      },
      {
        name: 'getReviewsByEventIdService',
        fn: () => getReviewsByEventIdService('event-1'),
        expected: [],
        spyFactory: () => jest.spyOn(Review, 'find')
      },
      {
        name: 'getReviewByIdService',
        fn: () => getReviewByIdService('event-1', 'review-1'),
        expected: null,
        spyFactory: () => jest.spyOn(Review, 'findOne')
      },
      {
        name: 'getReviewByEventAndAccountService',
        fn: () => getReviewByEventAndAccountService('event-1', 'account-1'),
        expected: null,
        spyFactory: () => jest.spyOn(Review, 'findOne')
      },
      {
        name: 'updateReviewService',
        fn: () => updateReviewService('event-1', 'review-1', { comment: 'nope' }),
        expected: null,
        spyFactory: () => jest.spyOn(Review, 'findOneAndUpdate')
      }
    ];

    test.each(blockedCalls)(
      '%s returns a fallback when Mongo is disconnected',
      async ({ fn, expected, spyFactory }) => {
        jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(false);
        const spy = spyFactory();

        const result = await fn();

        expect(result).toEqual(expected);
        expect(spy).not.toHaveBeenCalled();
      }
    );
  });

  describe('getReviewByEventAndAccountService', () => {
    test('normalizes plain objects without mongoose helpers', async () => {
      jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(true);
      const plainDoc = {
        comment: 'Standalone review',
        rating: 5,
        __v: 0
      };
      jest.spyOn(Review, 'findOne').mockResolvedValue(plainDoc);

      const result = await getReviewByEventAndAccountService('event-2', 'account-2');

      expect(result).toEqual({ comment: 'Standalone review', rating: 5 });
      expect(plainDoc).toEqual({ comment: 'Standalone review', rating: 5 });
    });
  });

  describe('createReviewService', () => {
    test('fills in optional fields when missing', async () => {
      jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(true);
      const id = new mongoose.Types.ObjectId();
      const createSpy = jest.spyOn(Review, 'create').mockResolvedValue({
        _id: id,
        eventId: id,
        accountId: 'user-1',
        rating: 4,
        comment: '',
        mediaUrls: [],
        toObject: jest.fn().mockReturnValue({
          _id: id,
          eventId: id,
          accountId: 'user-1',
          rating: 4,
          comment: '',
          mediaUrls: []
        })
      });

      const payload = {
        accountId: 'user-1',
        rating: 4,
        mediaUrls: 'not-an-array'
      };
      const result = await createReviewService('event-2', payload);

      expect(createSpy).toHaveBeenCalledWith({
        eventId: 'event-2',
        accountId: 'user-1',
        rating: 4,
        comment: '',
        mediaUrls: []
      });
      expect(result.comment).toBe('');
      expect(result.mediaUrls).toEqual([]);
    });
  });
  const mockEventLookup = (rows) => {
    const leanMock = jest.fn().mockResolvedValue(rows);
    const selectMock = jest.fn().mockReturnValue({ lean: leanMock });
    jest.spyOn(Event, 'find').mockReturnValue({ select: selectMock });
    return { leanMock, selectMock };
  };

  test('returns empty array when the database is unavailable', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(false);

    const result = await getReviewedEventsByAccountService('user-offline');

    expect(result).toEqual([]);
  });

  test('returns empty array when no reviews exist for the account', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(true);
    const sortMock = mockSortedFind([]);

    const result = await getReviewedEventsByAccountService('user-empty');

    expect(result).toEqual([]);
    expect(sortMock).toHaveBeenCalledWith({ updatedAt: -1 });
  });

  test('summarizes reviews even when event metadata is missing', async () => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(true);

    const sharedEventId = new mongoose.Types.ObjectId();
    const olderReview = createMockReviewDoc({
      eventId: sharedEventId,
      rating: 5,
      updatedAt: new Date('2024-01-01T10:00:00.000Z'),
      comment: 'First take'
    });
    const latestReview = createMockReviewDoc({
      eventId: sharedEventId,
      rating: 3,
      updatedAt: new Date('2024-02-01T12:00:00.000Z'),
      comment: 'Second take'
    });

    mockSortedFind([olderReview, latestReview]);
    mockEventLookup([]); // Force the "Unknown" fallbacks

    const result = await getReviewedEventsByAccountService('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      eventId: sharedEventId.toString(),
      eventTitle: 'Unknown event',
      location: 'Unknown location',
      totalReviews: 2,
      averageRating: 4,
      reviewId: latestReview._id.toString(),
      lastComment: 'Second take'
    });
  });
});
