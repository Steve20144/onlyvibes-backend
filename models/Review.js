import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    mediaUrls: [String]
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);
