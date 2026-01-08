// src/models/account.js
import mongoose from 'mongoose';

/**
 * Mongoose schema for user and venue accounts.
 * This schema defines the structure of account documents in the database,
 * including fields for authentication, user roles, and profile information.
 * It uses MongoDB's default `_id` for unique identification.
 */
const accountSchema = new mongoose.Schema({
  // The user's chosen username.
  username: {
    type: String,
    required: true,
    trim: true
  },
  // The user's email address, used for login and communication.
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  // The user's hashed password.
  password: {
    type: String,
    required: true
  },
  // The role of the account, which determines its permissions.
  role: {
    type: String,
    enum: ['user', 'venue', 'admin'],
    required: true
  },
  // A flag indicating whether the user has verified their email address.
  isVerified: {
    type: Boolean,
    default: false
  },
  // An array of user preferences, such as favorite music genres.
  preferences: {
    type: [String],
    default: []
  },
  // Additional details for accounts with the 'venue' role.
  venueDetails: {
    location: String,
    taxIdentificationNumHashed: Number,
    businessRegistrationNumHashed: Number
  }
},
{ 
  timestamps: true // Automatically adds createdAt and updatedAt fields.
}
);

// To prevent OverwriteModelError in test environments, check if the model already exists.
const Account =
  mongoose.models.Account || mongoose.model('Account', accountSchema);

export { Account };       // Named export
export default Account;   // Default export for `import Account from ...`
