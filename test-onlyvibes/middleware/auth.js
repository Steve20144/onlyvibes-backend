import { sendError } from '../utils/responses.js';
import { USER_ROLES } from '../config/constants.js';

const getCredentials = () => ({
  username: process.env.BASIC_AUTH_USER || 'onlyvibes',
  password: process.env.BASIC_AUTH_PASS || 'supersecret'
});

/**
 * Basic authentication guard using Authorization header.
 */
export const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Basic ')) {
    return sendError(res, { statusCode: 401, message: 'Basic authentication required', error: 'missing_header' });
  }

  const encoded = authHeader.split(' ')[1];

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');
    const expected = getCredentials();

    if (username !== expected.username || password !== expected.password) {
      return sendError(res, { statusCode: 401, message: 'Invalid credentials', error: 'unauthorized' });
    }

    req.authUser = { username };

    // allow client to pass role of the acting user for authorization flows (mocked auth)
    const userRole = req.headers['x-user-role'];
    if (userRole && Object.values(USER_ROLES).includes(userRole)) {
      req.authUser.role = userRole;
    }

    return next();
  } catch (error) {
    return sendError(res, { statusCode: 400, message: 'Malformed authorization header', error: error.message });
  }
};

/**
 * Role-based guard relying on x-user-role header (mocked) or default user role.
 * @param  {...string} roles
 */
export const requireRoles = (...roles) => (req, res, next) => {
  const userRole = req.authUser?.role || req.headers['x-user-role'];

  if (!userRole) {
    return sendError(res, { statusCode: 403, message: 'Missing role information', error: 'forbidden' });
  }

  if (!roles.includes(userRole)) {
    return sendError(res, { statusCode: 403, message: 'Insufficient privileges', error: 'forbidden' });
  }

  return next();
};
