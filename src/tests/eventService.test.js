/**
 * Unit tests for event service layer.
 * 
 * This test suite validates:
 * - Database connectivity checks and graceful degradation
 * - CRUD operations with proper error handling
 * - Document normalization (converting _id to id, removing __v)
 * - Category field normalization (string to array conversion)
 * - Filter building for list queries (category, location with regex)
 * - Null/missing data handling
 * 
 * Uses mocked Event model and dbHealth to isolate service logic.
 */
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import Event from '../models/event.js';
import {
  listEventsService,
  getEventByIdService,
  createEventService,
  updateEventService,
  deleteEventService,
  getLikedEventsByUserService
} from '../services/eventService.js';
import dbHealth from '../utils/dbHealth.js';

/**
 * Creates a mock Event document with toObject() method.
 * Used to simulate Mongoose documents in tests.
 */
const createMockDoc = (overrides = {}) => {
  const _id = overrides._id ?? new mongoose.Types.ObjectId();
  const baseDoc = {
    ...overrides,
    _id
  };

  return {
    ...baseDoc,
    toObject: jest.fn().mockReturnValue({ ...baseDoc })
  };
};

// Restore all mocks after each test to ensure isolation
afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Test suite for service behavior when database is disconnected.
 * All operations should fail gracefully with appropriate fallback values.
 */
describe('eventService when MongoDB is disconnected', () => {
  // Mock database as disconnected for all tests in this suite
  beforeEach(() => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(false);
  });

  // Test graceful degradation - should return empty array when DB is down
  test('listEventsService returns an empty array', async () => {
    const result = await listEventsService({ category: 'music' });

    expect(result).toEqual([]);
  });

  test('getEventByIdService returns null', async () => {
    const result = await getEventByIdService(new mongoose.Types.ObjectId().toString());

    expect(result).toBeNull();
  });

  test('updateEventService returns null', async () => {
    const result = await updateEventService(new mongoose.Types.ObjectId().toString(), {
      title: 'Won’t update'
    });

    expect(result).toBeNull();
  });

  test('deleteEventService returns false', async () => {
    const result = await deleteEventService(new mongoose.Types.ObjectId().toString());

    expect(result).toBe(false);
  });

  test('createEventService rejects with a database error', async () => {
    await expect(
      createEventService({
        creatorId: new mongoose.Types.ObjectId().toString(),
        title: 'Offline Event',
        location: 'Nowhere',
        dateTime: new Date().toISOString(),
        categories: ['music']
      })
    ).rejects.toThrow('Database not available');
  });
});

/**
 * Test suite for service behavior when database is connected.
 * Validates proper CRUD operations and data transformations.
 */
describe('eventService when MongoDB is connected', () => {
  // Mock database as connected for all tests in this suite
  beforeEach(() => {
    jest.spyOn(dbHealth, 'isDbConnected').mockReturnValue(true);
  });

  // Test query building with filters and document normalization
  test('listEventsService applies filters and normalizes results', async () => {
    const docs = [
      createMockDoc({
        title: 'Night Vibes Party',
        category: ['music'],
        location: 'Athens'
      })
    ];

    const sortMock = jest.fn().mockResolvedValue(docs);
    const findSpy = jest.spyOn(Event, 'find').mockReturnValue({ sort: sortMock });

    const result = await listEventsService({ category: 'music', location: 'ath' });

    expect(findSpy).toHaveBeenCalledWith({
      category: 'music',
      location: expect.any(RegExp)
    });
    expect(sortMock).toHaveBeenCalledWith({ dateTime: 1 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: 'Night Vibes Party',
      id: docs[0]._id.toString()
    });
  });

  test('listEventsService builds a case-insensitive regex for location-only filters', async () => {
    const docs = [
      createMockDoc({
        title: 'Patra Street Food',
        location: 'Patra'
      })
    ];
    const sortMock = jest.fn().mockResolvedValue(docs);
    const findSpy = jest.spyOn(Event, 'find').mockReturnValue({ sort: sortMock });

    const result = await listEventsService({ location: 'PA' });

    expect(findSpy).toHaveBeenCalledWith({ location: expect.any(RegExp) });
    const queryArg = findSpy.mock.calls[0][0];
    expect(queryArg).not.toHaveProperty('category');
    const regex = queryArg.location;
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.flags).toContain('i');
    expect(regex.test('patra')).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Patra Street Food');
  });

  test('listEventsService surfaces database errors from Event.find', async () => {
    const sortMock = jest.fn().mockRejectedValue(new Error('find failed'));
    jest.spyOn(Event, 'find').mockReturnValue({ sort: sortMock });

    await expect(listEventsService()).rejects.toThrow('find failed');
  });

  test('listEventsService assigns "id" and removes __v from normalized docs', async () => {
    const doc = createMockDoc({ title: 'Normalized Event', __v: 7 });
    const sortMock = jest.fn().mockResolvedValue([doc]);
    jest.spyOn(Event, 'find').mockReturnValue({ sort: sortMock });

    const [result] = await listEventsService();

    expect(result.id).toBe(doc._id.toString());
    expect(result).not.toHaveProperty('__v');
  });

  test('getEventByIdService returns a normalized document', async () => {
    const doc = createMockDoc({ title: 'Yoga Morning' });
    const spy = jest.spyOn(Event, 'findById').mockResolvedValue(doc);

    const result = await getEventByIdService(doc._id.toString());

    expect(spy).toHaveBeenCalledWith(doc._id.toString());
    expect(result).toMatchObject({ title: 'Yoga Morning', id: doc._id.toString() });
  });

  test('getEventByIdService returns null when document is missing', async () => {
    jest.spyOn(Event, 'findById').mockResolvedValue(null);

    const result = await getEventByIdService(new mongoose.Types.ObjectId().toString());

    expect(result).toBeNull();
  });

  test('getEventByIdService normalizes plain objects without toObject()', async () => {
    const _id = new mongoose.Types.ObjectId();
    const plainDoc = { _id, title: 'Plain Object', __v: 3 };
    jest.spyOn(Event, 'findById').mockResolvedValue(plainDoc);

    const result = await getEventByIdService(_id.toString());

    expect(result).toBe(plainDoc);
    expect(result.id).toBe(_id.toString());
    expect(result.__v).toBeUndefined();
  });

  test('createEventService normalizes payload before persisting', async () => {
    const createdDoc = createMockDoc({
      title: 'Created Event',
      category: ['music', 'dance']
    });
    const createSpy = jest.spyOn(Event, 'create').mockResolvedValue(createdDoc);
    const creatorId = new mongoose.Types.ObjectId().toString();
    const isoDate = new Date().toISOString();

    const result = await createEventService({
      creatorId,
      title: 'Created Event',
      location: 'Thessaloniki',
      dateTime: isoDate,
      categories: 'music, dance'
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId,
        title: 'Created Event',
        description: '',
        location: 'Thessaloniki',
        dateTime: new Date(isoDate),
        category: ['music', 'dance']
      })
    );
    expect(result).toMatchObject({ title: 'Created Event', id: createdDoc._id.toString() });
  });

  test('createEventService trims category strings, filters blanks, and omits empty image URLs', async () => {
    const createdDoc = createMockDoc({ title: 'Trimmed Categories' });
    const createSpy = jest.spyOn(Event, 'create').mockResolvedValue(createdDoc);
    const creatorId = new mongoose.Types.ObjectId().toString();
    const isoDate = new Date().toISOString();

    await createEventService({
      creatorId,
      title: 'Trimmed Categories',
      location: 'Athens',
      dateTime: isoDate,
      category: ' music , , dance ,  ',
      imageUrl: ''
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: ['music', 'dance'],
        imageUrl: undefined
      })
    );
  });

  test('createEventService trims category arrays and keeps non-string values intact', async () => {
    const createdDoc = createMockDoc({ title: 'Array Categories' });
    const createSpy = jest.spyOn(Event, 'create').mockResolvedValue(createdDoc);
    const creatorId = new mongoose.Types.ObjectId().toString();

    await createEventService({
      creatorId,
      title: 'Array Categories',
      location: 'Patra',
      dateTime: new Date().toISOString(),
      categories: [' art ', '', 'tech', 99]
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ category: ['art', 'tech', 99] })
    );
  });

  test('updateEventService normalizes category payloads and returns the updated event', async () => {
    const updatedDoc = createMockDoc({
      title: 'Night Vibes Reloaded',
      category: ['music', 'tech']
    });
    const spy = jest.spyOn(Event, 'findByIdAndUpdate').mockResolvedValue(updatedDoc);
    const isoDate = new Date().toISOString();
    const eventId = updatedDoc._id.toString();

    const result = await updateEventService(eventId, {
      categories: 'music, tech ',
      dateTime: isoDate,
      description: 'Updated description'
    });

    expect(spy).toHaveBeenCalledWith(
      eventId,
      {
        category: ['music', 'tech'],
        dateTime: new Date(isoDate),
        description: 'Updated description'
      },
      { new: true }
    );
    expect(result).toMatchObject({ title: 'Night Vibes Reloaded', id: eventId });
  });

  test('updateEventService removes legacy categories field and filters entries', async () => {
    const updatedDoc = createMockDoc({ title: 'Filtered Categories' });
    const spy = jest.spyOn(Event, 'findByIdAndUpdate').mockResolvedValue(updatedDoc);
    const eventId = updatedDoc._id.toString();

    await updateEventService(eventId, {
      category: [' music ', '', 'tech'],
      categories: ['should', 'not', 'persist']
    });

    const updatePayload = spy.mock.calls[0][1];
    expect(updatePayload.category).toEqual(['music', 'tech']);
    expect(updatePayload).not.toHaveProperty('categories');
  });

  test('updateEventService returns null when no document matches the id', async () => {
    jest.spyOn(Event, 'findByIdAndUpdate').mockResolvedValue(null);

    const result = await updateEventService(new mongoose.Types.ObjectId().toString(), {
      title: 'Will fail'
    });

    expect(result).toBeNull();
  });

  test('updateEventService leaves category untouched when none is provided', async () => {
    const updatedDoc = createMockDoc({ title: 'Plain Update' });
    const spy = jest.spyOn(Event, 'findByIdAndUpdate').mockResolvedValue(updatedDoc);
    const eventId = updatedDoc._id.toString();
    const updates = { title: 'Plain Update' };

    await updateEventService(eventId, updates);

    expect(spy).toHaveBeenCalledWith(eventId, expect.objectContaining(updates), {
      new: true
    });
    const updatePayload = spy.mock.calls[0][1];
    expect(updatePayload).not.toHaveProperty('category');
    expect(updatePayload).not.toHaveProperty('categories');
  });

  test('updateEventService surfaces database errors', async () => {
    const error = new Error('update failed');
    jest.spyOn(Event, 'findByIdAndUpdate').mockRejectedValue(error);

    await expect(
      updateEventService(new mongoose.Types.ObjectId().toString(), { title: 'Boom' })
    ).rejects.toThrow('update failed');
  });

  test('deleteEventService returns true when a document is removed', async () => {
    const deletedDoc = createMockDoc({ title: 'To Be Deleted' });
    const spy = jest.spyOn(Event, 'findByIdAndDelete').mockResolvedValue(deletedDoc);
    const id = deletedDoc._id.toString();

    const result = await deleteEventService(id);

    expect(spy).toHaveBeenCalledWith(id);
    expect(result).toBe(true);
  });

  test('deleteEventService returns false when no document is removed', async () => {
    jest.spyOn(Event, 'findByIdAndDelete').mockResolvedValue(null);

    const result = await deleteEventService(new mongoose.Types.ObjectId().toString());

    expect(result).toBe(false);
  });

  test('deleteEventService surfaces database errors', async () => {
    const error = new Error('delete failed');
    jest.spyOn(Event, 'findByIdAndDelete').mockRejectedValue(error);

    await expect(
      deleteEventService(new mongoose.Types.ObjectId().toString())
    ).rejects.toThrow('delete failed');
  });

  test('getLikedEventsByUserService returns empty array for missing or unknown user id', async () => {
    expect(await getLikedEventsByUserService()).toEqual([]);
    expect(await getLikedEventsByUserService('some-user')).toEqual([]);
  });

  test('getLikedEventsByUserService only logs when a user id is provided', async () => {
    const originalDebug = process.env.DEBUG_EVENTS;
    process.env.DEBUG_EVENTS = 'true';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await getLikedEventsByUserService();
    expect(consoleSpy).not.toHaveBeenCalled();

    await getLikedEventsByUserService('user-123');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[EVENT_SERVICE]',
      'getLikedEventsByUserService: called but not implemented',
      expect.objectContaining({ userId: 'user-123' })
    );

    process.env.DEBUG_EVENTS = originalDebug;
    consoleSpy.mockRestore();
  });
});
