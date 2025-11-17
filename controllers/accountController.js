import {
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
  getUserPreferences,
  updateUserPreferences,
  deleteUserPreferences,
  getVerificationRequest,
  submitVerificationRequest,
  updateVerificationRequest,
  getRecommendations,
  followTarget,
  unfollowTarget,
  getFollowers,
  getFollowing
} from '../services/accountService.js';
import { sendSuccess } from '../utils/responses.js';

/**
 * Creates an account resource.
 */
export const createAccountController = async (req, res, next) => {
  try {
    const account = await createAccount(req.body);
    return sendSuccess(res, { statusCode: 201, data: account, message: 'Account created successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieves account details.
 */
export const getAccountController = async (req, res, next) => {
  try {
    const account = await getAccountById(req.params.userId);
    if (!account) {
      return sendSuccess(res, { statusCode: 404, data: null, message: 'Account not found' });
    }

    return sendSuccess(res, { data: account });
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates account information.
 */
export const updateAccountController = async (req, res, next) => {
  try {
    const account = await updateAccount(req.params.userId, req.body);
    if (!account) {
      return sendSuccess(res, { statusCode: 404, data: null, message: 'Account not found' });
    }

    return sendSuccess(res, { data: account, message: 'Account updated successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes an account.
 */
export const deleteAccountController = async (req, res, next) => {
  try {
    const deleted = await deleteAccount(req.params.userId);
    if (!deleted) {
      return sendSuccess(res, { statusCode: 404, data: null, message: 'Account not found' });
    }

    return sendSuccess(res, { statusCode: 204, data: null, message: 'Account removed' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns user preferences.
 */
export const getPreferencesController = async (req, res, next) => {
  try {
    const preferences = await getUserPreferences(req.params.userId);
    if (!preferences) {
      return sendSuccess(res, { data: {}, message: 'No preferences configured' });
    }

    return sendSuccess(res, { data: preferences });
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates user preferences.
 */
export const updatePreferencesController = async (req, res, next) => {
  try {
    const account = await updateUserPreferences(req.params.userId, req.body);
    return sendSuccess(res, { data: account?.preferences || {}, message: 'Preferences updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes user preferences.
 */
export const deletePreferencesController = async (req, res, next) => {
  try {
    await deleteUserPreferences(req.params.userId);
    return sendSuccess(res, { message: 'Preferences removed' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieves current verification request.
 */
export const getVerificationController = async (req, res, next) => {
  try {
    const request = await getVerificationRequest(req.params.userId);
    if (!request) {
      return sendSuccess(res, { statusCode: 404, data: null, message: 'No verification request found' });
    }

    return sendSuccess(res, { data: request });
  } catch (error) {
    return next(error);
  }
};

/**
 * Submits a verification request.
 */
export const submitVerificationController = async (req, res, next) => {
  try {
    const request = await submitVerificationRequest(req.params.userId, req.body);
    return sendSuccess(res, { statusCode: 201, data: request, message: 'Verification request submitted' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates verification request details.
 */
export const updateVerificationController = async (req, res, next) => {
  try {
    const request = await updateVerificationRequest(req.params.userId, req.body);
    if (!request) {
      return sendSuccess(res, { statusCode: 404, data: null, message: 'No verification request found' });
    }

    return sendSuccess(res, { data: request, message: 'Verification request updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns recommendations for user.
 */
export const recommendationsController = async (req, res, next) => {
  try {
    const recommendations = await getRecommendations(req.params.userId, req.query.limit);
    return sendSuccess(res, { data: recommendations });
  } catch (error) {
    return next(error);
  }
};

/**
 * Adds follow relation.
 */
export const followController = async (req, res, next) => {
  try {
    const ok = await followTarget(req.params.userId, req.body.targetId);
    if (!ok) {
      return sendSuccess(res, { statusCode: 404, message: 'User or target not found' });
    }

    return sendSuccess(res, { message: 'Followed successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Removes follow relation.
 */
export const unfollowController = async (req, res, next) => {
  try {
    const ok = await unfollowTarget(req.params.userId, req.params.targetId);
    if (!ok) {
      return sendSuccess(res, { statusCode: 404, message: 'User or target not found' });
    }

    return sendSuccess(res, { message: 'Unfollowed successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lists followers.
 */
export const followersController = async (req, res, next) => {
  try {
    const followers = await getFollowers(req.params.userId);
    return sendSuccess(res, { data: followers });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lists following entries.
 */
export const followingController = async (req, res, next) => {
  try {
    const following = await getFollowing(req.params.userId);
    return sendSuccess(res, { data: following });
  } catch (error) {
    return next(error);
  }
};
