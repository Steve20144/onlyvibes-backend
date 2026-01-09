// src/tests/createTestDb.test.js
/**
 * Unit tests for the createTestDb test utility.
 * 
 * This test suite validates:
 * - MongoMemoryServer singleton behavior (only one instance created)
 * - Database connection management
 * - Collection clearing logic with connection state checks
 * 
 * Uses mocked mongoose instances to avoid actual database connections.
 */
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createTestDb } from './utils/testDb.js';

/**
 * Creates a mock mongoose instance for testing.
 * Simulates connection state and collection management.
 */
const createMockMongoose = () => {
  const connection = {
    readyState: 0,
    collections: {}
  };

  return {
    connection,
    connect: jest.fn(async () => {
      connection.readyState = 1;
    }),
    disconnect: jest.fn(async () => {
      connection.readyState = 0;
    })
  };
};

// Restore all mocks after each test
afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Test suite for the createTestDb utility.
 * Ensures proper lifecycle management of test database.
 */
describe('createTestDb helper', () => {
  // Test singleton pattern - MongoMemoryServer should only be created once
  test('connect only spins up the MongoMemoryServer once', async () => {
    const mockMongoose = createMockMongoose();
    const testDb = createTestDb({ mongooseInstance: mockMongoose });
    const mongoServerInstance = {
      getUri: jest.fn().mockReturnValue('mongodb://in-memory'),
      stop: jest.fn()
    };
    const createSpy = jest
      .spyOn(MongoMemoryServer, 'create')
      .mockResolvedValue(mongoServerInstance);

    await testDb.connect();
    await testDb.connect();

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(mockMongoose.connect).toHaveBeenCalledTimes(1);
  });

  // Test database clearing - should skip when mongoose is disconnected
  test('clearDatabase exits early when mongoose is disconnected', async () => {
    const mockMongoose = createMockMongoose();
    const testDb = createTestDb({ mongooseInstance: mockMongoose });
    const collection = { deleteMany: jest.fn() };
    mockMongoose.connection.collections = { alpha: collection };

    await testDb.clearDatabase();

    expect(collection.deleteMany).not.toHaveBeenCalled();
  });
});
