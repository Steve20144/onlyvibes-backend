// src/routes/accountsRoutes.js

const express = require("express");
const {
  createAccount,   // POST /accounts/register
  loginAccount,    // POST /accounts/login
  getAccountById,  // GET /accounts/:id
  updateAccount,   // PUT /accounts/:id
  deleteAccount,   // DELETE /accounts/:id
} = require("../controllers/accountController");

const router = express.Router();

// SIGN UP - create account
// POST /accounts
router.post("/register", createAccount);

// LOGIN - mock authentication
// POST /accounts/login
router.post("/login", loginAccount);

// GET /accounts/:id
router.get("/:id", getAccountById);

// PUT /accounts/:id
router.put("/:id", updateAccount);

// DELETE /accounts/:id
router.delete("/:id", deleteAccount);

module.exports = router;
