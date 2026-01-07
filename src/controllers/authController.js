// src/controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Account from '../models/account.js'; // adjust path/case to your actual model file

/**
 * SIGNUP — Create a new user and return JWT
 */
export async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'username, email, and password are required' });
    }

    // Check if email already exists
    const existing = await Account.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const account = await Account.create({
      username,
      email,
      password: hashedPassword,
      role: 'user',
    });

    // Generate JWT
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
 * LOGIN — Verify credentials and return JWT
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, account.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

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
