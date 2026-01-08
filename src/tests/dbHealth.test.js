/**
 * Unit tests for the database health check utility.
 * 
 * This test suite validates:
 * - Connection state detection using mongoose.connection.readyState
 * - Proper identification of connected state (readyState === 1)
 * - Rejection of disconnected, connecting, and disconnecting states
 */
import mongoose from 'mongoose';
import { isDbConnected } from '../utils/dbHealth.js';

/**
 * Test suite for database health check function.
 * Validates connection state detection logic.
 */
describe('dbHealth.isDbConnected', () => {
  // Store original readyState for restoration
  const originalReadyState = mongoose.connection.readyState;

  // Restore original readyState after each test
  afterEach(() => {
    mongoose.connection.readyState = originalReadyState;
  });

  // Test readyState interpretation - only 1 (connected) should return true
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
