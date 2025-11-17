import mongoose from 'mongoose';
import { VERIFICATION_STATUS, USER_ROLES } from '../config/constants.js';

const verificationRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    role: {
      type: String,
      enum: [USER_ROLES.VERIFIED_USER, USER_ROLES.VENUE],
      required: true
    },
    idType: String,
    idNumber: String,
    email: String,
    phoneNumber: String,
    documents: [String],
    status: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING
    },
    rejectionReason: String
  },
  { timestamps: true }
);

export const VerificationRequestModel =
  mongoose.models.VerificationRequest || mongoose.model('VerificationRequest', verificationRequestSchema);
