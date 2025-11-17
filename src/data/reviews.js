const reviews = [
  {
    reviewId: 'review-1',
    eventId: 'event-1',
    userId: 'user-2',
    rating: 5,
    comment: 'Unreal sunset set. Will go again!',
    media: [],
    createdAt: '2025-01-10T12:00:00.000Z',
    updatedAt: '2025-01-10T12:00:00.000Z'
  },
  {
    reviewId: 'review-2',
    eventId: 'event-1',
    userId: 'user-1',
    rating: 4,
    comment: 'Great vibe but bar queue was long.',
    media: ['https://cdn.onlyvibes.io/reviews/rev2.jpg'],
    createdAt: '2025-01-12T08:45:00.000Z',
    updatedAt: '2025-01-12T08:45:00.000Z'
  }
];

let nextReviewId = reviews.length + 1;

const clone = (value) => JSON.parse(JSON.stringify(value));

const listReviewsByEvent = (eventId) => reviews.filter((review) => review.eventId === eventId).map(clone);

const findReview = (eventId, reviewId) =>
  reviews.find((review) => review.eventId === eventId && review.reviewId === reviewId);

const addReviewRecord = (payload) => {
  const timestamp = new Date().toISOString();
  const review = {
    reviewId: `review-${nextReviewId++}`,
    eventId: payload.eventId,
    userId: payload.userId,
    rating: payload.rating,
    comment: payload.comment || '',
    media: payload.media || [],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  reviews.push(review);
  return clone(review);
};

const updateReviewRecord = (eventId, reviewId, updates) => {
  const review = findReview(eventId, reviewId);
  if (!review) {
    return null;
  }

  Object.assign(review, updates, { updatedAt: new Date().toISOString() });
  return clone(review);
};

const deleteReviewRecord = (eventId, reviewId) => {
  const index = reviews.findIndex(
    (review) => review.eventId === eventId && review.reviewId === reviewId
  );

  if (index === -1) {
    return false;
  }

  reviews.splice(index, 1);
  return true;
};

module.exports = {
  listReviewsByEvent,
  findReview,
  addReviewRecord,
  updateReviewRecord,
  deleteReviewRecord
};
