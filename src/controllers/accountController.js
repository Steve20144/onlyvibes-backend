// src/controllers/accountsController.js

const { accounts } = require("../data/accounts");
const {
  Account,
  createAccountFromBody,
  sanitizeAccount,
} = require("../models/account");

// In-memory αντιγραφή ώστε να μπορούμε να κάνουμε "mutate"
let accountsData = [...accounts];

function getNextId() {
  const maxId =
    accountsData.length > 0 ? Math.max(...accountsData.map((a) => a.id)) : 0;
  return maxId + 1;
}

// ---------- SIGN UP (POST /accounts/register) ----------
function createAccount(req, res, next) {
  try {
    const newAccount = createAccountFromBody(req.body);
    newAccount.id = getNextId();

    accountsData.push(newAccount);

    res.status(201).json({
      data: sanitizeAccount(newAccount),
    });
  } catch (err) {
    next(err);
  }
}

// ---------- LOGIN (POST /accounts/login) ----------
function loginAccount(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("email and password are required");
      err.status = 400;
      throw err;
    }

    const account = accountsData.find(
      (a) => a.email === email && a.password === password
    );

    if (!account) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    // Για MVP: επιστρέφουμε απλώς τον account χωρίς password + fake token
    res.json({
      data: sanitizeAccount(account),
      token: "mock-jwt-token", // placeholder για frontend
    });
  } catch (err) {
    next(err);
  }
}

// ---------- GET /accounts/:id ----------
function getAccountById(req, res) {
  const id = Number(req.params.id);
  const account = accountsData.find((a) => a.id === id);

  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  res.json({ data: sanitizeAccount(account) });
}

// ---------- PUT /accounts/:id ----------
function updateAccount(req, res) {
  const id = Number(req.params.id);
  const index = accountsData.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Account not found" });
  }

  const existing = accountsData[index];
  const { username, email, password, role } = req.body;

  accountsData[index] = new Account(
    existing.id,
    username ?? existing.username,
    email ?? existing.email,
    password ?? existing.password,
    role ?? existing.role,
    existing.createdAt,
    new Date().toISOString()
  );

  res.json({ data: sanitizeAccount(accountsData[index]) });
}

// ---------- DELETE /accounts/:id ----------
function deleteAccount(req, res) {
  const id = Number(req.params.id);
  const index = accountsData.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Account not found" });
  }

  const deleted = accountsData[index];
  accountsData.splice(index, 1);

  res.json({ data: sanitizeAccount(deleted) });
}

module.exports = {
  createAccount,    // Sign Up
  loginAccount,     // Login
  getAccountById,
  updateAccount,
  deleteAccount,
};
