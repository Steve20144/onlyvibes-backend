import mongoose from 'mongoose';
import { isDbConnected } from '../utils/dbHealth.js';

describe('dbHealth.isDbConnected', () => {
  const originalReadyState = mongoose.connection.readyState;

  afterEach(() => {
    mongoose.connection.readyState = originalReadyState;
  });

  test('returns true only when readyState equals 1', () => {
    mongoose.connection.readyState = 0; // disconnected
    expect(isDbConnected()).toBe(false);

    mongoose.connection.readyState = 1; // connected
    expect(isDbConnected()).toBe(true);

    mongoose.connection.readyState = 2; // connecting
    expect(isDbConnected()).toBe(false);

    mongoose.connection.readyState = 3; // disconnecting
    expect(isDbConnected()).toBe(false);
  });
});
