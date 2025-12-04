import { jest } from '@jest/globals';

const mockConnect = jest.fn();

jest.unstable_mockModule('mongoose', () => ({
  __esModule: true,
  default: {
    connect: mockConnect
  }
}));

const { connectDB } = await import('../../config/database.js');

const ORIGINAL_ENV = { ...process.env };

describe('connectDB', () => {
  let exitSpy;
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    mockConnect.mockReset();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.MONGO_URI;
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => {
        throw new Error('process.exit called');
      });
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
    process.env = ORIGINAL_ENV;
  });

  test('exits immediately when MONGO_URI is missing', async () => {
    await expect(connectDB()).rejects.toThrow('process.exit called');

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Missing MONGO_URI in environment variables'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  test('connects and logs success when MONGO_URI is present', async () => {
    process.env.MONGO_URI = 'mongodb://localhost/test';
    mockConnect.mockResolvedValue({});

    await expect(connectDB()).resolves.toBeUndefined();

    expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    expect(logSpy).toHaveBeenCalledWith('✅ MongoDB connected successfully');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('logs the error and exits when mongoose.connect rejects', async () => {
    process.env.MONGO_URI = 'mongodb://localhost/fail';
    mockConnect.mockRejectedValue(new Error('boom'));

    await expect(connectDB()).rejects.toThrow('process.exit called');

    expect(mockConnect).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('❌ MongoDB connection error:', 'boom');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
