import mongoose from 'mongoose';
import { EVENT_STATUS } from '../config/constants.js';

const locationSchema = new mongoose.Schema(
  {
    name: String,
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      required: true
    },
    dateTime: {
      type: Date,
      required: true
    },
    location: locationSchema,
    imageUrl: String,
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    availableSeats: Number,
    isCancelled: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.ACTIVE
    },
    likes: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const EventModel = mongoose.models.Event || mongoose.model('Event', eventSchema);
