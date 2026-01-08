// src/middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate requests using a JSON Web Token (JWT).
 * It checks for a valid 'Bearer' token in the 'Authorization' header,
 * verifies it, and attaches the decoded user payload to the request object.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {void} Calls the next middleware or sends an error response.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid Authorization header format' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not set in environment');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Verify the token and decode its payload.
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    // Attach the decoded user information to the request object.
    req.user = decoded;
    return next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
