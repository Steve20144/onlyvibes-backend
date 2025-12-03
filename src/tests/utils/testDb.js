import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Factory to create an isolated in-memory MongoDB instance per test suite.
 * Optionally accepts a dedicated mongoose instance for advanced scenarios.
 */
export const createTestDb = ({ mongooseInstance } = {}) => {
  const suiteMongoose = mongooseInstance ?? mongoose;
  let mongoServer = null;
  let mongoUri = '';

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

      if (suiteMongoose.connection?.readyState === 1) {
        return;
      }

      await suiteMongoose.connect(mongoUri);
    },

    /**
     * Drop all documents from every collection.
     */
    async clearDatabase() {
      if (suiteMongoose.connection?.readyState !== 1) return;

      const deletionJobs = Object.values(suiteMongoose.connection.collections).map(
        (collection) => collection.deleteMany({})
      );

      await Promise.all(deletionJobs);
    },

    /**
     * Disconnect mongoose and stop the in-memory server.
     */
    async disconnect() {
      if (suiteMongoose.connection?.readyState && suiteMongoose.connection.readyState !== 0) {
        await suiteMongoose.disconnect();
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
    },

    /**
     * Return the mongoose instance backing this helper.
     */
    getMongoose() {
      return suiteMongoose;
    }
  };
};

export default createTestDb;
