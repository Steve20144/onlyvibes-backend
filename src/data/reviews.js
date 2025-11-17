// src/data/reviews.js

export const reviews = [
  {
    reviewId: 1,
    eventId: 1,
    userId: 'user-1',
    rating: 5,
    comment: 'Incredible vibes and flawless production.',
    mediaUrls: ['https://example.com/reviews/1/photo.jpg'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    reviewId: 2,
    eventId: 2,
    userId: 'user-2',
    rating: 4,
    comment: 'Great instructors, but started a little late.',
    mediaUrls: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

let currentReviewId = reviews.length;

/**
 * Generate a new incremental review ID.
 * @returns {number}
 */
export const getNextReviewId = () => {
  currentReviewId += 1;
  return currentReviewId;
};

/**
 * Reset the review id counter (primarily for tests).
 * @param {number} value
 */
export const resetReviewIdCounter = (value = reviews.length) => {
  currentReviewId = value;
};
