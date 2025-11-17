const express = require('express');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.get('/events/:eventId/reviews', reviewController.getReviewsByEvent);
router.post('/events/:eventId/reviews', reviewController.createReview);
router.get('/events/:eventId/reviews/:reviewId', reviewController.getReviewById);
router.put('/events/:eventId/reviews/:reviewId', reviewController.updateReview);
router.delete('/events/:eventId/reviews/:reviewId', reviewController.deleteReview);

module.exports = router;
