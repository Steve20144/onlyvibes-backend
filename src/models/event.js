// src/models/event.js
import mongoose from 'mongoose';

/**
 * Event schema.
 */
const eventSchema = new mongoose.Schema({
  eventId: {
    type: Number,
    required: true,
    unique: true
  },
  creatorId: {
    type: String,
    required: true // id of Account
  },
  title: {
    type: String,
    required: true,
    trim: true
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
  location: {
    type: String,
    required: true
  },
  latitude: Number,
  longitude: Number,
  imageUrl: String,
  isCancelled: {
    type: Boolean,
    default: false
  }
});
const Event =
  mongoose.models.Event || mongoose.model('Event', eventSchema);

export { Event };       // named
export default Event; 
