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

const mockConnectionState = (state) => {
  mongoose.connection.readyState = state;
};

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

afterEach(() => {
  jest.restoreAllMocks();
});

describe('eventService when MongoDB is disconnected', () => {
  test('listEventsService returns an empty array', async () => {
    mockConnectionState(0);

    const result = await listEventsService({ category: 'music' });

    expect(result).toEqual([]);
  });

  test('getEventByIdService returns null', async () => {
    mockConnectionState(0);

    const result = await getEventByIdService(new mongoose.Types.ObjectId().toString());

    expect(result).toBeNull();
  });

  test('updateEventService returns null', async () => {
    mockConnectionState(0);

    const result = await updateEventService(new mongoose.Types.ObjectId().toString(), {
      title: 'Won’t update'
    });

    expect(result).toBeNull();
  });

  test('deleteEventService returns false', async () => {
    mockConnectionState(0);

    const result = await deleteEventService(new mongoose.Types.ObjectId().toString());

    expect(result).toBe(false);
  });

  test('createEventService rejects with a database error', async () => {
    mockConnectionState(0);

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

describe('eventService when MongoDB is connected', () => {
  beforeEach(() => {
    mockConnectionState(1);
  });

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

  test('updateEventService returns null when no document matches the id', async () => {
    jest.spyOn(Event, 'findByIdAndUpdate').mockResolvedValue(null);

    const result = await updateEventService(new mongoose.Types.ObjectId().toString(), {
      title: 'Will fail'
    });

    expect(result).toBeNull();
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

  test('getLikedEventsByUserService returns empty array for missing or unknown user id', async () => {
    expect(await getLikedEventsByUserService()).toEqual([]);
    expect(await getLikedEventsByUserService('some-user')).toEqual([]);
  });
});
