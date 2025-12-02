import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Factory to create an isolated in-memory MongoDB instance per test suite.
 */
export const createTestDb = () => {
  let mongoServer = null;
  let mongoUri = '';

  return {
    /**
     * Spin up mongodb-memory-server and connect mongoose to it.
     */
    async connect() {
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    },

    /**
     * Drop all documents from every collection.
     */
    async clearDatabase() {
      if (!mongoose.connection?.collections) return;

      const deletionJobs = Object.values(mongoose.connection.collections).map(
        (collection) => collection.deleteMany({})
      );

      await Promise.all(deletionJobs);
    },

    /**
     * Disconnect mongoose and stop the in-memory server.
     */
    async disconnect() {
      await mongoose.disconnect();

      if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
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
