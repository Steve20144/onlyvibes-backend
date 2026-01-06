// src/models/event.js
import mongoose from 'mongoose';

const logEventModelDebug = (...args) => {
  if (process.env.DEBUG_EVENTS === 'true' || process.env.DEBUG === 'true') {
    console.log('[EVENT_MODEL]', ...args);
  }
};

const logEventModelError = (...args) => {
  console.error('[EVENT_MODEL]', ...args);
};

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

// Debug hooks
eventSchema.post('save', function (doc) {
  logEventModelDebug('Event saved', { id: doc._id?.toString(), title: doc.title });
});

eventSchema.post('findOneAndUpdate', function (doc) {
  if (!doc) return;
  logEventModelDebug('Event updated', { id: doc._id?.toString(), title: doc.title });
});

eventSchema.post('findOneAndDelete', function (doc) {
  if (!doc) return;
  logEventModelDebug('Event deleted', { id: doc._id?.toString(), title: doc.title });
});

// Error hook
eventSchema.post('save', function (error, _doc /* unused */, next) {
  if (error) {
    logEventModelError('Error during save', error);
  }
  next(error);
});

const Event =
  mongoose.models.Event || mongoose.model('Event', eventSchema);

export { Event };
export default Event;
