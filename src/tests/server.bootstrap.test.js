/**
 * Unit tests for server bootstrap logic.
 * 
 * This test suite validates:
 * - Database connection on server startup
 * - Server listening on correct port (default 3000 or from PORT env var)
 * - Environment variable handling (PORT configuration)
 * - Proper module loading and initialization sequence
 * 
 * Uses mocked database connection and app.listen to avoid actual server startup.
 */
import { jest } from '@jest/globals';

// Store original environment for restoration after tests
const ORIGINAL_ENV = { ...process.env };

/**
 * Helper function to load server module with fresh mocks.
 * Resets module cache and sets up mocks for database and app.
 * 
 * @returns {Object} Mock spies for database connection, server listen, and console.log
 */
const loadServer = async () => {
  jest.resetModules();

  const connectDBMock = jest.fn();
  const listenMock = jest.fn((port, callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  });

  jest.unstable_mockModule('../../config/database.js', () => ({
    __esModule: true,
    connectDB: connectDBMock
  }));

  jest.unstable_mockModule('../app.js', () => ({
    __esModule: true,
    default: {
      listen: listenMock
    }
  }));

  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  await import('../server.js');

  return { connectDBMock, listenMock, logSpy };
};

/**
 * Test suite for server bootstrap process.
 * Validates initialization sequence and configuration.
 */
describe('server bootstrap', () => {
  // Restore environment after each test
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  // Test default port - should use 3000 when PORT env var is not set
  test('connects to the database and listens on the default port', async () => {
    delete process.env.PORT;

    const { connectDBMock, listenMock, logSpy } = await loadServer();

    expect(connectDBMock).toHaveBeenCalledTimes(1);
    expect(listenMock).toHaveBeenCalledTimes(1);
    expect(listenMock.mock.calls[0][0]).toBe(3000);
    expect(logSpy).toHaveBeenCalledWith('OnlyVibes API listening on http://localhost:3000');

    logSpy.mockRestore();
  });

  // Test custom port - should respect PORT environment variable
  test('honors the PORT environment variable', async () => {
    process.env.PORT = '5555';

    const { listenMock, logSpy } = await loadServer();

    expect(listenMock).toHaveBeenCalledWith('5555', expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith('OnlyVibes API listening on http://localhost:5555');

    logSpy.mockRestore();
  });
});
