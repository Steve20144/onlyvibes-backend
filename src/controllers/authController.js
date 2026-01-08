// src/controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Account from '../models/account.js'; // adjust path/case to your actual model file

/**
 * Handles user signup. It creates a new user account, hashes the password,
 * and returns a JSON Web Token (JWT) for authentication.
 *
 * @async
 * @param {import('express').Request} req - The Express request object, containing the user's credentials in the body.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A JSON response with a success message, JWT, and user details.
 */
export async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Basic validation to ensure all required fields are present.
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'username, email, and password are required' });
    }

    // Check if an account with the given email already exists to prevent duplicates.
    const existing = await Account.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash the user's password for security before storing it.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user account with the provided details.
    const account = await Account.create({
      username,
      email,
      password: hashedPassword,
      role: 'user',
    });

    // Generate a JWT to authenticate the user in subsequent requests.
    const token = jwt.sign(
      {
        id: account._id.toString(),
        email: account.email,
        role: account.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    return res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: account._id,
        username: account.username,
        email: account.email,
        role: account.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Handles user login. It verifies the user's credentials and, if successful,
 * returns a JSON Web Token (JWT) for authentication.
 *
 * @async
 * @param {import('express').Request} req - The Express request object, containing the user's credentials.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<import('express').Response>} A JSON response with a success message, JWT, and user details.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find the user by email. If not found, the credentials are invalid.
    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password.
    const passwordMatch = await bcrypt.compare(password, account.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If credentials are valid, generate a new JWT.
    const token = jwt.sign(
      {
        id: account._id.toString(),
        email: account.email,
        role: account.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: account._id,
        username: account.username,
        email: account.email,
        role: account.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}
