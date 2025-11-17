import mongoose from 'mongoose';
import { ACCOUNT_STATUS, USER_ROLES, VERIFICATION_STATUS } from '../config/constants.js';

const preferenceSchema = new mongoose.Schema(
  {
    categories: [String],
    locations: [String],
    priceRange: {
      min: Number,
      max: Number
    },
    notificationOptIn: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING
    },
    idType: String,
    idNumber: String,
    documents: [String],
    email: String,
    phoneNumber: String,
    notes: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const accountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER
    },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Account',
      default: []
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Account',
      default: []
    },
    preferences: preferenceSchema,
    verification: verificationSchema,
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const AccountModel = mongoose.models.Account || mongoose.model('Account', accountSchema);
