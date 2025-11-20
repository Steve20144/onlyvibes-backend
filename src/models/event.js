// src/models/event.js
import mongoose from 'mongoose';

/**
 * Event schema – only what the UI actually needs.
 */
const eventSchema = new mongoose.Schema(
  {
    // Set from auth (req.user.id), NOT from the form
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ''
    },

    // e.g. "Athens City Center Rooftop"
    location: {
      type: String,
      required: true,
      trim: true
    },

    // Selected time & date from the UI
    dateTime: {
      type: Date,
      required: true
    },

    /**
     * “Select Categories” → allow multiple categories.
     * Yes, it's called `category` and it's an array.
     * No, we’re not renaming it to `categories` for the 5th time.
     */
    category: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one category is required'
      }
    },

    // From “Upload Photos” (optional)
    imageUrl: {
      type: String
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

const Event =
  mongoose.models.Event || mongoose.model('Event', eventSchema);

export { Event };
export default Event;
