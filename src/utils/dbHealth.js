// src/utils/dbHealth.js
import mongoose from 'mongoose';

const dbHealth = {
	/**
	 * Centralized Mongo connection health check so tests can stub it safely.
	 * @returns {boolean}
	 */
	isDbConnected: () => mongoose.connection.readyState === 1
};

export const isDbConnected = () => dbHealth.isDbConnected();

export default dbHealth;
