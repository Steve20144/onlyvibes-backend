// src/services/accountService.js
import { accounts } from '../data/accounts.js';

/**
 * Generate a simple unique account id.
 * @returns {string}
 */
const generateAccountId = () =>
  `acc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

/**
 * Create a new account (user or venue).
 * @async
 * @param {{email:string,name:string,password:string,role:string,preferences?:string[],venueDetails?:object}} payload
 * @returns {Promise<object>}
 */
export const createAccountService = async (payload) => {
  const now = new Date();

  const newAccount = {
    id: generateAccountId(),
    username: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    isVerified: payload.role === 'venue', // simple rule: venues start as verified
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
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export const getAccountByIdService = async (id) => {
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
  const index = accounts.findIndex((acc) => acc.id === id);
  if (index === -1) return null;

  const updated = {
    ...accounts[index],
    ...updates,
    updatedAt: new Date()
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
  const index = accounts.findIndex((acc) => acc.id === id);
  if (index === -1) return false;

  accounts.splice(index, 1);
  return true;
};
