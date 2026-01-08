// src/models/event.js
import mongoose from 'mongoose';

/**
 * Logs debug messages for the event model if debugging is enabled.
 * @param {...any} args - The messages to log.
 */
const logEventModelDebug = (...args) => {
  if (process.env.DEBUG_EVENTS === 'true' || process.env.DEBUG === 'true') {
    console.log('[EVENT_MODEL]', ...args);
  }
};

/**
 * Logs error messages for the event model.
 * @param {...any} args - The error messages to log.
 */
const logEventModelError = (...args) => {
  console.error('[EVENT_MODEL]', ...args);
};

/**
 * Mongoose schema for events.
 * This schema defines the structure of event documents in the database,
 * including fields for the creator, title, location, and other details.
 * It also includes timestamps for creation and updates.
 */
const eventSchema = new mongoose.Schema(
  {
    // The ID of the account that created the event, linked to the 'Account' model.
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },

    // The title of the event.
    title: {
      type: String,
      required: true,
      trim: true
    },

    // A description of the event.
    description: {
      type: String,
      default: ''
    },

    // The physical location of the event.
    location: {
      type: String,
      required: true,
      trim: true
    },

    // The date and time when the event is scheduled to occur.
    dateTime: {
      type: Date,
      required: true
    },

    /**
     * An array of categories that the event belongs to.
     * The field is named `category` but stores an array of strings.
     */
    category: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one category is required'
      }
    },

    // An optional URL for an image associated with the event.
    imageUrl: {
      type: String
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields.
  }
);

// Mongoose hook to log a message after an event is saved.
eventSchema.post('save', function (doc) {
  logEventModelDebug('Event saved', { id: doc._id?.toString(), title: doc.title });
});

// Mongoose hook to log a message after an event is updated.
eventSchema.post('findOneAndUpdate', function (doc) {
  if (!doc) return;
  logEventModelDebug('Event updated', { id: doc._id?.toString(), title: doc.title });
});

// Mongoose hook to log a message after an event is deleted.
eventSchema.post('findOneAndDelete', function (doc) {
  if (!doc) return;
  logEventModelDebug('Event deleted', { id: doc._id?.toString(), title: doc.title });
});

// Mongoose hook to log any errors that occur during a save operation.
// eslint-disable-next-line no-unused-vars
eventSchema.post('save', function (error, doc, next) {
  if (error) {
    logEventModelError('Error during save', error);
  }
  next(error);
});

const Event =
  mongoose.models.Event || mongoose.model('Event', eventSchema);

export { Event };
export default Event;
