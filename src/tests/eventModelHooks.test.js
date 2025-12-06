import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import Event from '../models/event.js';

const getPostHook = (hookName, labelSnippet) => {
  const posts = Event.schema?.s?.hooks?._posts;
  if (!posts?.has(hookName)) {
    throw new Error(`No post hooks registered for ${hookName}`);
  }

  const match = posts
    .get(hookName)
    .map((entry) => entry.fn)
    .find((fn) => typeof fn === 'function' && fn.toString().includes(labelSnippet));

  if (!match) {
    throw new Error(`Unable to find hook containing "${labelSnippet}"`);
  }

  return match;
};

const createDoc = (overrides = {}) => ({
  _id: overrides._id ?? new mongoose.Types.ObjectId(),
  title: overrides.title ?? 'Only Vibes',
  ...overrides
});

describe('Event model hooks', () => {
  let originalDebugEvents;
  let originalDebug;

  beforeEach(() => {
    jest.restoreAllMocks();
    originalDebugEvents = process.env.DEBUG_EVENTS;
    originalDebug = process.env.DEBUG;
    delete process.env.DEBUG_EVENTS;
    delete process.env.DEBUG;
  });

  afterEach(() => {
    process.env.DEBUG_EVENTS = originalDebugEvents;
    process.env.DEBUG = originalDebug;
  });

  test('save hook logs only when debug flags are enabled and always includes metadata', () => {
    const saveLogHook = getPostHook('save', 'Event saved');
    const doc = createDoc({ title: 'Summer Rooftop' });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    saveLogHook(doc);
    expect(consoleSpy).not.toHaveBeenCalled();

    process.env.DEBUG_EVENTS = 'true';
    saveLogHook(doc);
    expect(consoleSpy).toHaveBeenLastCalledWith(
      '[EVENT_MODEL]',
      'Event saved',
      expect.objectContaining({ id: doc._id.toString(), title: 'Summer Rooftop' })
    );

    consoleSpy.mockClear();
    delete process.env.DEBUG_EVENTS;
    process.env.DEBUG = 'true';
    saveLogHook(doc);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[EVENT_MODEL]',
      'Event saved',
      expect.objectContaining({ id: doc._id.toString(), title: 'Summer Rooftop' })
    );
  });

  test('save hook tolerates missing IDs when logging', () => {
    const saveLogHook = getPostHook('save', 'Event saved');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env.DEBUG_EVENTS = 'true';

    const doc = { title: 'Untitled Event' };
    expect(() => saveLogHook(doc)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('[EVENT_MODEL]', 'Event saved', {
      id: undefined,
      title: 'Untitled Event'
    });
  });

  test('findOneAndUpdate hook guards against missing docs and logs payload metadata', () => {
    const updateHook = getPostHook('findOneAndUpdate', 'Event updated');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env.DEBUG_EVENTS = 'true';

    updateHook(null);
    expect(consoleSpy).not.toHaveBeenCalled();

    const updatedDoc = createDoc({ title: 'Updated Fiesta' });
    updateHook(updatedDoc);
    expect(consoleSpy).toHaveBeenLastCalledWith('[EVENT_MODEL]', 'Event updated', {
      id: updatedDoc._id.toString(),
      title: 'Updated Fiesta'
    });

    const docWithoutId = { title: 'No ID Update' };
    expect(() => updateHook(docWithoutId)).not.toThrow();
  });

  test('findOneAndDelete hook only logs when a doc exists and uses safe id access', () => {
    const deleteHook = getPostHook('findOneAndDelete', 'Event deleted');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env.DEBUG_EVENTS = 'true';

    deleteHook(null);
    expect(consoleSpy).not.toHaveBeenCalled();

    const deletedDoc = createDoc({ title: 'Deleted Fiesta' });
    deleteHook(deletedDoc);
    expect(consoleSpy).toHaveBeenLastCalledWith('[EVENT_MODEL]', 'Event deleted', {
      id: deletedDoc._id.toString(),
      title: 'Deleted Fiesta'
    });

    const docWithoutId = { title: 'No ID Delete' };
    expect(() => deleteHook(docWithoutId)).not.toThrow();
  });

  test('save error hook logs failures and forwards the error', () => {
    const errorHook = getPostHook('save', 'Error during save');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const next = jest.fn();
    const error = new Error('DB write failed');

    errorHook(error, createDoc(), next);

    expect(consoleSpy).toHaveBeenCalledWith('[EVENT_MODEL]', 'Error during save', error);
    expect(next).toHaveBeenCalledWith(error);
  });
});
