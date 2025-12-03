import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Factory to create an isolated in-memory MongoDB instance per test suite.
 */
export const createTestDb = () => {
  let mongoServer = null;
  let mongoUri = '';
  let isConnected = false;

  const ensureServer = async () => {
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }
  };

  return {
    /**
     * Spin up mongodb-memory-server and connect mongoose to it.
     */
    async connect() {
      await ensureServer();

      if (isConnected && mongoose.connection.readyState === 1) {
        return;
      }

      await mongoose.connect(mongoUri);
      isConnected = true;
    },

    /**
     * Drop all documents from every collection.
     */
    async clearDatabase() {
      if (!isConnected || !mongoose.connection?.collections) return;

      const deletionJobs = Object.values(mongoose.connection.collections).map(
        (collection) => collection.deleteMany({})
      );

      await Promise.all(deletionJobs);
    },

    /**
     * Disconnect mongoose and stop the in-memory server.
     */
    async disconnect() {
      if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
      }

      if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
        mongoUri = '';
      }
    },

    /**
     * Expose the current Mongo URI for manual reconnections in tests.
     */
    getUri() {
      return mongoUri;
    }
  };
};

export default createTestDb;
