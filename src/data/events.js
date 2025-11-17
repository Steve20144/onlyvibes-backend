// src/data/events.js

export const events = [
  {
    eventId: 1,
    creatorId: 'venue-1',
    title: 'Night Vibes Party',
    description: 'An unforgettable night with top DJs.',
    category: 'music',
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    location: 'Athens',
    latitude: 37.9838,
    longitude: 23.7275,
    imageUrl: 'https://example.com/events/night-vibes.jpg',
    isCancelled: false
  },
  {
    eventId: 2,
    creatorId: 'venue-1',
    title: 'Morning Yoga in the Park',
    description: 'Relax & stretch at the national garden.',
    category: 'sports',
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    location: 'Athens',
    latitude: 37.9715,
    longitude: 23.7267,
    imageUrl: 'https://example.com/events/yoga.jpg',
    isCancelled: false
  }
];

let currentEventId = events.length;

/**
 * Get next incremental event ID.
 * @returns {number}
 */
export const getNextEventId = () => {
  currentEventId += 1;
  return currentEventId;
};
