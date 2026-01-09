// src/utils/dbHealth.js
import mongoose from 'mongoose';

/**
 * @namespace dbHealth
 * @description A utility object for checking database health.
 */
const dbHealth = {
  /**
   * Checks if the Mongoose connection is currently in the 'connected' state.
   * This is a centralized health check to allow for easier testing and stubbing.
   * @returns {boolean} `true` if connected, `false` otherwise.
   */
  isDbConnected: () => mongoose.connection.readyState === 1
};

/**
 * A standalone function that checks if the Mongoose connection is active.
 * @returns {boolean} `true` if the database is connected, otherwise `false`.
 */
export const isDbConnected = () => dbHealth.isDbConnected();

export default dbHealth;
