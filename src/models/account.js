// src/models/account.js
import mongoose from 'mongoose';

/**
 * Account schema for users and venues.
 * We now rely on Mongo's default `_id` instead of a custom `id` field.
 */
const accountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'venue', 'admin'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    type: [String],
    default: []
  },
  venueDetails: {
    location: String,
    taxIdentificationNumHashed: Number,
    businessRegistrationNumHashed: Number
  }
},
{ 
  timestamps: true // createdAt, updatedAt
}
);

// Avoid OverwriteModelError when tests reload things
const Account =
  mongoose.models.Account || mongoose.model('Account', accountSchema);

export { Account };       // named
export default Account;   // default for `import Account from ...`
