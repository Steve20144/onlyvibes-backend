const reviewService = require('../services/reviewServices');

const respondWithError = (res, error) => {
  const status = error.status || 500;
  const payload = { message: error.message };
  if (error.details) {
    payload.details = error.details;
  }

  return res.status(status).json(payload);
};

const getReviewsByEvent = (req, res) => {
  try {
    const payload = reviewService.getReviewsForEvent(req.params.eventId);
    return res.json(payload);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const getReviewById = (req, res) => {
  try {
    const review = reviewService.getReviewById(req.params.eventId, req.params.reviewId);
    return res.json(review);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const createReview = (req, res) => {
  try {
    const review = reviewService.createReview(req.params.eventId, req.body);
    return res.status(201).json(review);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const updateReview = (req, res) => {
  try {
    const review = reviewService.updateReview(req.params.eventId, req.params.reviewId, req.body);
    return res.json(review);
  } catch (error) {
    return respondWithError(res, error);
  }
};

const deleteReview = (req, res) => {
  try {
    reviewService.deleteReview(req.params.eventId, req.params.reviewId, req.body);
    return res.status(204).send();
  } catch (error) {
    return respondWithError(res, error);
  }
};

module.exports = {
  getReviewsByEvent,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
};
