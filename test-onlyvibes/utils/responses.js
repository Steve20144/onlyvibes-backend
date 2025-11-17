/**
 * Helper to return a standard success response envelope.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=200]
 * @param {*} [options.data=null]
 * @param {string} [options.message='Request completed successfully']
 * @returns {import('express').Response}
 */
export const sendSuccess = (res, { statusCode = 200, data = null, message = 'Request completed successfully' } = {}) =>
  res.status(statusCode).json({ success: true, data, message, error: null });

/**
 * Helper to return a standard error response envelope.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=500]
 * @param {string} [options.message='Something went wrong']
 * @param {*} [options.error=null]
 * @returns {import('express').Response}
 */
export const sendError = (res, { statusCode = 500, message = 'Something went wrong', error = null } = {}) =>
  res.status(statusCode).json({ success: false, data: null, message, error });
