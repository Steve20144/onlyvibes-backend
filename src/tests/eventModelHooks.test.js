/**
 * Unit tests for Event model hooks (Mongoose middleware).
 * 
 * This test suite validates:
 * - Post-save hooks with debug logging
 * - Post-update hooks with null document handling
 * - Post-delete hooks with existence checks
 * - Error hooks for save operations
 * - Debug flag behavior (DEBUG_EVENTS and DEBUG environment variables)
 * - Safe property access for documents without _id
 */
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import Event from '../models/event.js';

/**
 * Helper function to extract a specific post-hook from the Event schema.
 * 
 * @param {string} hookName - The hook name (e.g., 'save', 'findOneAndUpdate')
 * @param {string} labelSnippet - A string to identify the specific hook by its content
 * @returns {Function} The matching hook function
 */
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

/**
 * Creates a mock event document for testing hooks.
 * 
 * @param {Object} overrides - Properties to override in the mock document
 * @returns {Object} Mock event document
 */
const createDoc = (overrides = {}) => ({
  _id: overrides._id ?? new mongoose.Types.ObjectId(),
  title: overrides.title ?? 'Only Vibes',
  ...overrides
});

/**
 * Test suite for Event model Mongoose hooks.
 * Validates logging and error handling in model lifecycle events.
 */
describe('Event model hooks', () => {
  let originalDebugEvents;
  let originalDebug;

  // Setup: Store original environment variables and restore mocks
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

  // Test save hook - should log only when debug flags are enabled
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

  // Test save hook robustness - should handle documents without _id
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

  // Test update hook - should guard against null documents
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

  // Test delete hook - should only log when document exists
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

  // Test error hook - should log errors and forward them via next()
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
