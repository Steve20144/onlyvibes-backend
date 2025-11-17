import mongoose from 'mongoose';

let isConnected = false;

/**
 * Attempts to connect to MongoDB. If no URI is provided, the app continues in mock mode.
 * @returns {Promise<boolean>} Boolean indicating whether the connection succeeded.
 */
export const connectDatabase = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    console.warn('[OnlyVibes] No MONGO_URI provided. Falling back to mock data mode.');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.info('[OnlyVibes] MongoDB connection established.');
    return true;
  } catch (error) {
    console.error('[OnlyVibes] Failed to connect to MongoDB. Running in mock data mode.', error.message);
    isConnected = false;
    return false;
  }
};

/**
 * Indicates whether the application currently has an active database connection.
 * @returns {boolean}
 */
export const isDatabaseConnected = () => isConnected;
