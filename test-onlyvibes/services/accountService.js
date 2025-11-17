import { isDatabaseConnected } from '../config/database.js';
import { AccountModel } from '../models/Account.js';
import { VerificationRequestModel } from '../models/VerificationRequest.js';
import { EventModel } from '../models/Event.js';
import { mockDb, addMockItem, updateMockItem, deleteMockItem } from '../data/mockData.js';
import { VERIFICATION_STATUS } from '../config/constants.js';

const useDatabase = () => isDatabaseConnected();

/**
 * Retrieves a single account by identifier.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export const getAccountById = async (userId) => {
  if (useDatabase()) {
    return AccountModel.findById(userId).lean();
  }

  return mockDb.accounts.find((account) => account.id === userId) || null;
};

/**
 * Creates a new account resource.
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const createAccount = async (payload) => {
  if (useDatabase()) {
    const created = await AccountModel.create(payload);
    return created.toObject();
  }

  return addMockItem('accounts', { followers: [], following: [], ...payload });
};

/**
 * Updates an account.
 * @param {string} userId
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
export const updateAccount = async (userId, updates) => {
  if (useDatabase()) {
    return AccountModel.findByIdAndUpdate(userId, updates, { new: true }).lean();
  }

  return updateMockItem('accounts', userId, { ...updates, updatedAt: new Date().toISOString() });
};

/**
 * Deletes an account.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const deleteAccount = async (userId) => {
  if (useDatabase()) {
    const deleted = await AccountModel.findByIdAndDelete(userId);
    return Boolean(deleted);
  }

  return deleteMockItem('accounts', userId);
};

/**
 * Returns user preferences.
 * @param {string} userId
 */
export const getUserPreferences = async (userId) => {
  const account = await getAccountById(userId);
  return account?.preferences || null;
};

/**
 * Replaces user preferences.
 * @param {string} userId
 * @param {object} preferences
 */
export const updateUserPreferences = async (userId, preferences) => {
  if (useDatabase()) {
    return AccountModel.findByIdAndUpdate(userId, { preferences }, { new: true }).lean();
  }

  return updateMockItem('accounts', userId, { preferences });
};

/**
 * Removes stored user preferences.
 * @param {string} userId
 */
export const deleteUserPreferences = async (userId) => {
  return updateAccount(userId, { preferences: null });
};

/**
 * Gets the verification request associated with a user.
 * @param {string} userId
 */
export const getVerificationRequest = async (userId) => {
  if (useDatabase()) {
    return VerificationRequestModel.findOne({ userId }).lean();
  }

  return mockDb.verificationRequests.find((request) => request.userId === userId) || null;
};

/**
 * Submits a new verification request for a user.
 * @param {string} userId
 * @param {object} payload
 */
export const submitVerificationRequest = async (userId, payload) => {
  if (useDatabase()) {
    const created = await VerificationRequestModel.create({
      userId,
      status: VERIFICATION_STATUS.PENDING,
      ...payload
    });
    return created.toObject();
  }

  return addMockItem('verificationRequests', { userId, status: VERIFICATION_STATUS.PENDING, ...payload });
};

/**
 * Updates an existing verification request.
 * @param {string} userId
 * @param {object} payload
 */
export const updateVerificationRequest = async (userId, payload) => {
  if (useDatabase()) {
    return VerificationRequestModel.findOneAndUpdate({ userId }, payload, { new: true }).lean();
  }

  const request = mockDb.verificationRequests.find((req) => req.userId === userId);
  if (!request) {
    return null;
  }

  Object.assign(request, payload);
  return request;
};

/**
 * Generates simple personalized recommendations based on stored preferences.
 * @param {string} userId
 * @param {number} limit
 */
export const getRecommendations = async (userId, limit = Number(process.env.RECOMMENDATION_LIMIT) || 5) => {
  const preferences = await getUserPreferences(userId);

  if (useDatabase()) {
    const query = {};
    if (preferences?.categories?.length) {
      query.category = { $in: preferences.categories };
    }
    if (preferences?.locations?.length) {
      query['location.city'] = { $in: preferences.locations };
    }

    return EventModel.find(query).limit(limit).lean();
  }

  let events = mockDb.events;
  if (preferences?.categories?.length) {
    events = events.filter((event) => preferences.categories.includes(event.category));
  }
  if (preferences?.locations?.length) {
    events = events.filter((event) => preferences.locations.includes(event.location?.city));
  }

  return events.slice(0, limit);
};

/**
 * Adds a follow relationship between two accounts.
 * @param {string} userId
 * @param {string} targetId
 */
export const followTarget = async (userId, targetId) => {
  if (useDatabase()) {
    await AccountModel.findByIdAndUpdate(userId, { $addToSet: { following: targetId } });
    await AccountModel.findByIdAndUpdate(targetId, { $addToSet: { followers: userId } });
    return true;
  }

  const follower = mockDb.accounts.find((account) => account.id === userId);
  const target = mockDb.accounts.find((account) => account.id === targetId);
  if (!follower || !target) return false;
  if (!follower.following.includes(targetId)) follower.following.push(targetId);
  if (!target.followers.includes(userId)) target.followers.push(userId);
  return true;
};

/**
 * Removes a follow relationship.
 * @param {string} userId
 * @param {string} targetId
 */
export const unfollowTarget = async (userId, targetId) => {
  if (useDatabase()) {
    await AccountModel.findByIdAndUpdate(userId, { $pull: { following: targetId } });
    await AccountModel.findByIdAndUpdate(targetId, { $pull: { followers: userId } });
    return true;
  }

  const follower = mockDb.accounts.find((account) => account.id === userId);
  const target = mockDb.accounts.find((account) => account.id === targetId);
  if (!follower || !target) return false;
  follower.following = follower.following.filter((id) => id !== targetId);
  target.followers = target.followers.filter((id) => id !== userId);
  return true;
};

/**
 * Lists a user followers.
 * @param {string} userId
 */
export const getFollowers = async (userId) => {
  const account = await getAccountById(userId);
  if (!account) return [];

  if (useDatabase()) {
    return AccountModel.find({ _id: { $in: account.followers } }).lean();
  }

  return mockDb.accounts.filter((acc) => account.followers.includes(acc.id));
};

/**
 * Lists user following entries.
 * @param {string} userId
 */
export const getFollowing = async (userId) => {
  const account = await getAccountById(userId);
  if (!account) return [];

  if (useDatabase()) {
    return AccountModel.find({ _id: { $in: account.following } }).lean();
  }

  return mockDb.accounts.filter((acc) => account.following.includes(acc.id));
};
