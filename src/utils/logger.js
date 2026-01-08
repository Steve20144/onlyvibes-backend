// src/utils/logger.js
import debug from 'debug';

/**
 * A debug logger specifically for logging incoming HTTP requests.
 * To enable, set the DEBUG environment variable to 'onlyvibes:req' or 'onlyvibes:*'.
 * @example
 * logRequest('GET /users');
 */
export const logRequest = debug('onlyvibes:req');

/**
 * A debug logger for logging application errors.
 * To enable, set the DEBUG environment variable to 'onlyvibes:error' or 'onlyvibes:*'.
 * @example
 * logError('Database connection failed');
 */
export const logError = debug('onlyvibes:error');
