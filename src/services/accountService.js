// src/services/accountService.js
import mongoose from 'mongoose';
import Account from '../models/account.js';         // default export

/**
 * Check if MongoDB is connected.
 * @returns {boolean}
 */
const isDbConnected = () => mongoose.connection.readyState === 1;

const ensureDbConnected = () => {
  if (!isDbConnected()) {
    const err = new Error('Database not available');
    err.statusCode = 503;
    throw err;
  }
};

/**
 * Normalize a Mongoose document to a plain JS object and ensure `id` field exists.
 * In Mongo mode, we expose `_id` as `id` for the API.
 * @param {object} doc
 * @returns {object|null}
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
 * Create a new account (user or venue).
 * @async
 * @param {{email:string,name:string,password:string,role:string,preferences?:string[],venueDetails?:object}} payload
 * @returns {Promise<object>}
 */
export const createAccountService = async (payload) => {
  const now = new Date();

  ensureDbConnected();

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
 * Get an account by id.
 * @async
 * @param {string} id  - In Mongo mode this is `_id`, in mock mode it's `accounts[].id`
 * @returns {Promise<object|null>}
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
 * Update an account by id.
 * @async
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object|null>}
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
 * Delete an account by id.
 * @async
 * @param {string} id
 * @returns {Promise<boolean>}
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
