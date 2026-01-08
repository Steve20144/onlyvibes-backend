// /config/database.js
import mongoose from 'mongoose';

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 *
 * This function reads the MongoDB connection string from the environment variables,
 * connects to the database, and logs the connection status. If the connection
 * string is missing or if the connection fails, it logs an error and exits
 * the process.
 *
 * @async
 * @function connectDB
 * @throws {Error} If the MONGO_URI environment variable is not set.
 * @throws {Error} If the database connection fails.
 */
export const connectDB = async () => {
  // Retrieve the MongoDB connection URI from environment variables.
  const mongoUri = process.env.MONGO_URI;

  // A connection string is required to connect to the database.
  if (!mongoUri) {
    console.error('❌ Missing MONGO_URI in environment variables');
    process.exit(1); // Exit the process with a failure code.
  }

  try {
    // Attempt to connect to MongoDB with the provided URI and options.
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true, // Use the new URL parser.
      useUnifiedTopology: true, // Use the new server discovery and monitoring engine.
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    // If an error occurs during connection, log it and exit.
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Exit the process with a failure code.
  }
};
