// src/models/review.js
import mongoose from 'mongoose';

/**
 * Review schema aligned with Mongo ObjectId usage (similar to Event/Account models).
 */
const reviewSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    accountId: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      default: ''
    },
    mediaUrls: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Review =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);

export { Review };
export default Review;
