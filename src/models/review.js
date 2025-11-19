// src/models/review.js
import mongoose from 'mongoose';

/**
 * Review schema capturing event ratings and optional media.
 */
const reviewSchema = new mongoose.Schema({
  reviewId: {
    type: Number,
    required: true,
    unique: true
  },
  eventId: {
    type: Number,
    required: true
  },
  userId: {
    type: String,
    required: true
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

const Review =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);

export { Review };       // named
export default Review; 
