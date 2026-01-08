// src/services/accountService.js
import Account from '../models/account.js';         // default export
import { isDbConnected } from '../utils/dbHealth.js';

/**
 * Ensures that the database is connected before proceeding.
 * @throws {Error} If the database is not connected.
 */
const ensureDbConnected = () => {
  if (!isDbConnected()) {
    const err = new Error('Database not available');
    err.statusCode = 503;
    throw err;
  }
};

/**
 * Checks if an email address is already in use.
 * @async
 * @param {string} email - The email address to check.
 * @throws {Error} If the email is already in use.
 */
const ensureEmailAvailable = async (email) => {
  const normalizedEmail = typeof email === 'string' ? email.toLowerCase() : email;
  const existing = await Account.findOne({ email: normalizedEmail });

  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }
};

/**
 * Normalizes a Mongoose account document into a plain JavaScript object.
 * It converts `_id` to `id` and removes the version key `__v`.
 * @param {object} doc - The Mongoose document to normalize.
 * @returns {object|null} The normalized object, or null if the input is falsy.
 */
const normalizeAccountDoc = (doc) => {
  if (!doc) return null;

  const obj = doc.toObject ? doc.toObject() : doc;

  // Expose Mongo's _id as a top-level `id`
  if (obj._id && !obj.id) {
    obj.id = obj._id.toString();
  }

  delete obj.__v;
  return obj;
};

/**
 * Creates a new user or venue account.
 * @async
 * @param {object} payload - The data for the new account.
 * @param {string} payload.email - The user's email address.
 * @param {string} payload.name - The user's name.
 * @param {string} payload.password - The user's password.
 * @param {string} payload.role - The role of the account ('user' or 'venue').
 * @param {string[]} [payload.preferences] - An array of user preferences.
 * @param {object} [payload.venueDetails] - Additional details for venue accounts.
 * @returns {Promise<object>} A promise that resolves to the newly created account object.
 */
export const createAccountService = async (payload) => {
  const now = new Date();

  ensureDbConnected();
  await ensureEmailAvailable(payload.email);

  try {
    const doc = await Account.create({
      username: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      isVerified: payload.role === 'venue',
      preferences: payload.preferences || [],
      venueDetails: payload.venueDetails || null,
      createdAt: now,
      updatedAt: now
    });

    return normalizeAccountDoc(doc);
  } catch (error) {
    console.error('createAccountService: MongoDB error:', error.message);
    throw error;
  }
};

/**
 * Retrieves an account by its ID.
 * @async
 * @param {string} id - The ID of the account to retrieve.
 * @returns {Promise<object|null>} A promise that resolves to the account object, or null if not found.
 */
export const getAccountByIdService = async (id) => {
  ensureDbConnected();

  try {
    const doc = await Account.findById(id);
    return normalizeAccountDoc(doc);
  } catch (error) {
    console.error('getAccountByIdService: MongoDB error:', error.message);
    throw error;
  }
};

/**
 * Updates an account by its ID.
 * @async
 * @param {string} id - The ID of the account to update.
 * @param {object} updates - An object containing the fields to update.
 * @returns {Promise<object|null>} A promise that resolves to the updated account object, or null if not found.
 */
export const updateAccountService = async (id, updates) => {
  const now = new Date();

  ensureDbConnected();

  try {
    const doc = await Account.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: now },
      { new: true, runValidators: true }
    );

    return normalizeAccountDoc(doc);
  } catch (error) {
    console.error('updateAccountService: MongoDB error:', error.message);
    throw error;
  }
};

/**
 * Deletes an account by its ID.
 * @async
 * @param {string} id - The ID of the account to delete.
 * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful, false otherwise.
 */
export const deleteAccountService = async (id) => {
  ensureDbConnected();

  try {
    const result = await Account.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    console.error('deleteAccountService: MongoDB error:', error.message);
    throw error;
  }
};
