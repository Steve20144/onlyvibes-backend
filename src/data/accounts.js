// src/data/accounts.js

// Mock accounts για το MVP (passwords σε plain text ΜΟΝΟ για demo!)
const accounts = [
  {
    id: 1,
    username: "demoUser",
    email: "demo@example.com",
    password: "password123",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "demoVenue",
    email: "venue@example.com",
    password: "venue123",
    role: "venue",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

module.exports = { accounts };
