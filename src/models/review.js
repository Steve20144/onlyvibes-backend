// src/models/review.js
import mongoose from 'mongoose';

/**
 * Mongoose schema for reviews.
 * This schema defines the structure of review documents, which are associated with
 * both an event and an account. It includes fields for the rating, a text comment,
 * and optional media URLs.
 */
const reviewSchema = new mongoose.Schema(
  {
    // The ID of the event being reviewed, linked to the 'Event' model.
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true // Index for faster queries on event reviews.
    },
    // The ID of the account that submitted the review.
    accountId: {
      type: String,
      required: true,
      trim: true
    },
    // A numerical rating from 1 to 5.
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    // An optional text comment for the review.
    comment: {
      type: String,
      default: ''
    },
    // An array of URLs for any media (e.g., images, videos) attached to the review.
    mediaUrls: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields.
  }
);

// To prevent OverwriteModelError in test environments, check if the model already exists.
const Review =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);

export { Review };
export default Review;
