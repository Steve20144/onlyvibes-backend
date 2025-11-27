// src/services/accountService.js
import mongoose from 'mongoose';
import Account from '../models/account.js';         // default export
import { accounts } from '../data/accounts.js';

/**
 * Generate a simple unique account id for mock storage.
 * @returns {string}
 */
const generateAccountId = () =>
  `acc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

/**
 * Check if MongoDB is connected.
 * @returns {boolean}
 */
const isDbConnected = () => mongoose.connection.readyState === 1;

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

  if (isDbConnected()) {
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

      // Will add `id` from `_id`
      return normalizeAccountDoc(doc);
    } catch (error) {
      console.error(
        'createAccountService: MongoDB error, falling back to mock:',
        error.message
      );
    }
  }

  // Fallback to mock data when DB is not connected
  const id = generateAccountId();

  const newAccount = {
    id,
    username: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    isVerified: payload.role === 'venue',
    preferences: payload.preferences || [],
    venueDetails: payload.venueDetails || null,
    createdAt: now,
    updatedAt: now
  };

  accounts.push(newAccount);
  return newAccount;
};

/**
 * Get an account by id.
 * @async
 * @param {string} id  - In Mongo mode this is `_id`, in mock mode it's `accounts[].id`
 * @returns {Promise<object|null>}
 */
export const getAccountByIdService = async (id) => {
  if (isDbConnected()) {
    try {
      const doc = await Account.findById(id); // uses Mongo `_id`
      return normalizeAccountDoc(doc);
    } catch (error) {
      console.error(
        'getAccountByIdService: MongoDB error, falling back to mock:',
        error.message
      );
    }
  }

  const account = accounts.find((acc) => acc.id === id);
  return account || null;
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

  if (isDbConnected()) {
    try {
      const doc = await Account.findByIdAndUpdate(
        id, // _id in Mongo
        { ...updates, updatedAt: now },
        { new: true }
      );

      return normalizeAccountDoc(doc);
    } catch (error) {
      console.error(
        'updateAccountService: MongoDB error, falling back to mock:',
        error.message
      );
    }
  }

  const index = accounts.findIndex((acc) => acc.id === id);
  if (index === -1) return null;

  const updated = {
    ...accounts[index],
    ...updates,
    updatedAt: now
  };

  accounts[index] = updated;
  return updated;
};

/**
 * Delete an account by id.
 * @async
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export const deleteAccountService = async (id) => {
  if (isDbConnected()) {
    try {
      const result = await Account.findByIdAndDelete(id); // _id in Mongo
      return !!result;
    } catch (error) {
      console.error(
        'deleteAccountService: MongoDB error, falling back to mock:',
        error.message
      );
    }
  }

  const index = accounts.findIndex((acc) => acc.id === id);
  if (index === -1) return false;

  accounts.splice(index, 1);
  return true;
};
