// src/models/account.js
import mongoose from 'mongoose';

/**
 * Account schema for users and venues.
 */
const accountSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true // our own string id (not _id)
  },
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
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
});

export const Account = mongoose.model('Account', accountSchema);
