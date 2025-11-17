const accountService = require('../services/accountServices');

const respondWithError = (res, error) => {
  const status = error.status || 500;
  const payload = { message: error.message };
  if (error.details) {
    payload.details = error.details;
  }

  return res.status(status).json(payload);
};

const listAccounts = (req, res) => {
  try {
    const accounts = accountService.listAccounts();
    return res.json({ results: accounts.length, accounts });
  } catch (error) {
    return respondWithError(res, error);
  }
};

const createAccount = (req, res) => {
  try {
    const account = accountService.createAccount(req.body);
    return res.status(201).json(account);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const getAccount = (req, res) => {
  try {
    const account = accountService.getAccount(req.params.userId);
    return res.json(account);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const updateAccount = (req, res) => {
  try {
    const account = accountService.updateAccount(req.params.userId, req.body);
    return res.json(account);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const deleteAccount = (req, res) => {
  try {
    accountService.deleteAccount(req.params.userId);
    return res.status(204).send();
  } catch (error) {
    return respondWithError(res, error);
  }
};

const loginAccount = (req, res) => {
  try {
    const result = accountService.authenticate(req.body);
    return res.json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
};

module.exports = {
  listAccounts,
  createAccount,
  getAccount,
  updateAccount,
  deleteAccount,
  loginAccount
};
