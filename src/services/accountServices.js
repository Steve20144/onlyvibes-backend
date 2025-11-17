const {
  listAccounts,
  findAccountById,
  findAccountByEmail,
  createAccountRecord,
  updateAccountRecord,
  deleteAccountRecord
} = require('../data/accounts');
const { validateNewAccount, validateAccountUpdate } = require('../models/account');

const buildError = (status, message, details) => ({ status, message, details });

const createAccount = (payload) => {
  const validation = validateNewAccount(payload);
  if (!validation.isValid) {
    throw buildError(400, 'Invalid account payload', validation.errors);
  }

  const exists = findAccountByEmail(payload.email);
  if (exists) {
    throw buildError(409, 'Account already exists');
  }

  return createAccountRecord(payload);
};

const getAccount = (userId) => {
  const account = findAccountById(userId);
  if (!account) {
    throw buildError(404, 'Account not found');
  }

  return account;
};

const updateAccount = (userId, updates) => {
  const validation = validateAccountUpdate(updates);
  if (!validation.isValid) {
    throw buildError(400, 'Invalid account update', validation.errors);
  }

  const updated = updateAccountRecord(userId, updates);
  if (!updated) {
    throw buildError(404, 'Account not found');
  }

  return updated;
};

const deleteAccount = (userId) => {
  const deleted = deleteAccountRecord(userId);
  if (!deleted) {
    throw buildError(404, 'Account not found');
  }
};

const authenticate = ({ email, password }) => {
  if (!email || !password) {
    throw buildError(400, 'email and password are required');
  }

  const account = findAccountByEmail(email);
  if (!account || account.password !== password) {
    throw buildError(401, 'Invalid credentials');
  }

  return {
    token: `mock-token-${account.userId}`,
    user: account
  };
};

module.exports = {
  createAccount,
  getAccount,
  updateAccount,
  deleteAccount,
  listAccounts,
  authenticate
};
