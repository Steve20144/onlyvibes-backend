import { jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

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

describe('server bootstrap', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  test('connects to the database and listens on the default port', async () => {
    delete process.env.PORT;

    const { connectDBMock, listenMock, logSpy } = await loadServer();

    expect(connectDBMock).toHaveBeenCalledTimes(1);
    expect(listenMock).toHaveBeenCalledTimes(1);
    expect(listenMock.mock.calls[0][0]).toBe(3000);
    expect(logSpy).toHaveBeenCalledWith('OnlyVibes API listening on http://localhost:3000');

    logSpy.mockRestore();
  });

  test('honors the PORT environment variable', async () => {
    process.env.PORT = '5555';

    const { listenMock, logSpy } = await loadServer();

    expect(listenMock).toHaveBeenCalledWith('5555', expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith('OnlyVibes API listening on http://localhost:5555');

    logSpy.mockRestore();
  });
});
