// src/tests/createTestDb.test.js
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createTestDb } from './utils/testDb.js';

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

afterEach(() => {
  jest.restoreAllMocks();
});

describe('createTestDb helper', () => {
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

  test('clearDatabase exits early when mongoose is disconnected', async () => {
    const mockMongoose = createMockMongoose();
    const testDb = createTestDb({ mongooseInstance: mockMongoose });
    const collection = { deleteMany: jest.fn() };
    mockMongoose.connection.collections = { alpha: collection };

    await testDb.clearDatabase();

    expect(collection.deleteMany).not.toHaveBeenCalled();
  });
});
