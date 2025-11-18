// src/services/accountService.js
import mongoose from 'mongoose';
import Account from '../models/Account.js'; // <- adjust path/name if needed
import { accounts } from '../data/accounts.js';

/**
 * Generate a simple unique account id (used only for mock fallback).
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
 * @param {object} doc
 * @returns {object|null}
 */
const normalizeAccountDoc = (doc) => {
  if (!doc) return null;

  const obj = doc.toObject ? doc.toObject() : doc;

  // Add a top-level `id` for consistency with mock data
  if (obj._id && !obj.id) {
    obj.id = obj._id.toString();
  }

  // Optional: remove internal fields
  delete obj.__v;

  return obj;
};

/**
 * Create a new account (user or venue).
 * Tries MongoDB first; falls back to in-memory mock data if DB is unavailable.
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
        isVerified: payload.role === 'venue', // simple rule: venues start as verified
        preferences: payload.preferences || [],
        venueDetails: payload.venueDetails || null,
        createdAt: now,
        updatedAt: now
      });

      return normalizeAccountDoc(doc);
    } catch (error) {
      console.error('createAccountService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  const newAccount = {
    id: generateAccountId(),
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
 * Tries MongoDB first; falls back to mock if DB not available or query fails.
 * @async
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export const getAccountByIdService = async (id) => {
  if (isDbConnected()) {
    try {
      const doc = await Account.findById(id);
      return normalizeAccountDoc(doc);
    } catch (error) {
      console.error('getAccountByIdService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  const account = accounts.find((acc) => acc.id === id);
  return account || null;
};

/**
 * Update an account by id.
 * Tries MongoDB first; falls back to mock if DB not available or query fails.
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
        id,
        { ...updates, updatedAt: now },
        { new: true }
      );

      return normalizeAccountDoc(doc);
    } catch (error) {
      console.error('updateAccountService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
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
 * Tries MongoDB first; falls back to mock if DB not available or query fails.
 * @async
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export const deleteAccountService = async (id) => {
  if (isDbConnected()) {
    try {
      const result = await Account.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('deleteAccountService: MongoDB error, falling back to mock:', error.message);
    }
  }

  // Fallback: mock data
  const index = accounts.findIndex((acc) => acc.id === id);
  if (index === -1) return false;

  accounts.splice(index, 1);
  return true;
};
