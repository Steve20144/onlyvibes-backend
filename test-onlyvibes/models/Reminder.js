import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    remindAt: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    isSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const ReminderModel = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);
