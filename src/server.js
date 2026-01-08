/**
 * @file This file is the main entry point for the OnlyVibes API server.
 * It initializes the environment, connects to the database, and starts the Express app.
 */

import app from './app.js';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';

// Load environment variables from a .env file into process.env
dotenv.config();

// Establish a connection to the MongoDB database
connectDB();

/**
 * The port number for the server to listen on.
 * It uses the PORT environment variable if available, otherwise defaults to 3000.
 * @type {number}
 */
const PORT = process.env.PORT || 3000;

// Start the Express server
app.listen(PORT, () => {
  console.log(`OnlyVibes API listening on http://localhost:${PORT}`);
});




