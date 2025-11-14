// src/models/account.js

class Account {
  constructor(id, username, email, password, role, createdAt, updatedAt) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password; // ΠΡΟΣΟΧΗ: plain text μόνο για mock περιβάλλον
    this.role = role || "user";
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}

// Δημιουργεί Account από request body (για Sign Up)
function createAccountFromBody(body) {
  const { username, email, password, role } = body;

  if (!username || !email || !password) {
    const err = new Error("username, email and password are required");
    err.status = 400;
    throw err;
  }

  return new Account(
    null,        // id θα μπει αργότερα
    username,
    email,
    password,
    role || "user",
    new Date().toISOString(),
    new Date().toISOString()
  );
}

// Αφαιρεί το password από το object πριν το στείλουμε στο frontend
function sanitizeAccount(account) {
  if (!account) return null;
  const { password, ...rest } = account;
  return rest;
}

module.exports = {
  Account,
  createAccountFromBody,
  sanitizeAccount,
};
