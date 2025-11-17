import { Router } from 'express';
import { basicAuth, requireRoles } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validation.js';
import {
  eventFilterQuery,
  eventBody,
  eventUpdateBody,
  eventIdParam,
  reviewBody,
  reviewUpdateBody,
  reviewIdParam
} from '../utils/validators.js';
import {
  listEventsController,
  createEventController,
  getEventController,
  updateEventController,
  deleteEventController,
  likeEventController,
  unlikeEventController,
  getLikesController,
  listReviewsController,
  createReviewController,
  getReviewController,
  updateReviewController,
  deleteReviewController
} from '../controllers/eventController.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.get('/', basicAuth, eventFilterQuery(), handleValidation, listEventsController);
router.post(
  '/',
  basicAuth,
  requireRoles(USER_ROLES.VERIFIED_USER, USER_ROLES.VENUE, USER_ROLES.ADMIN),
  eventBody(),
  handleValidation,
  createEventController
);

router.get('/:eventId', basicAuth, eventIdParam(), handleValidation, getEventController);
router.put(
  '/:eventId',
  basicAuth,
  requireRoles(USER_ROLES.VERIFIED_USER, USER_ROLES.VENUE, USER_ROLES.ADMIN),
  eventIdParam(),
  eventUpdateBody(),
  handleValidation,
  updateEventController
);
router.delete(
  '/:eventId',
  basicAuth,
  requireRoles(USER_ROLES.VERIFIED_USER, USER_ROLES.VENUE, USER_ROLES.ADMIN),
  eventIdParam(),
  handleValidation,
  deleteEventController
);

router.post(
  '/:eventId/like',
  basicAuth,
  eventIdParam(),
  handleValidation,
  likeEventController
);
router.delete(
  '/:eventId/like',
  basicAuth,
  eventIdParam(),
  handleValidation,
  unlikeEventController
);
router.get('/:eventId/likes', basicAuth, eventIdParam(), handleValidation, getLikesController);

router.get(
  '/:eventId/reviews',
  basicAuth,
  eventIdParam(),
  handleValidation,
  listReviewsController
);
router.post(
  '/:eventId/reviews',
  basicAuth,
  eventIdParam(),
  reviewBody(),
  handleValidation,
  createReviewController
);
router.get(
  '/:eventId/reviews/:reviewId',
  basicAuth,
  eventIdParam(),
  reviewIdParam(),
  handleValidation,
  getReviewController
);
router.put(
  '/:eventId/reviews/:reviewId',
  basicAuth,
  eventIdParam(),
  reviewIdParam(),
  reviewUpdateBody(),
  handleValidation,
  updateReviewController
);
router.delete(
  '/:eventId/reviews/:reviewId',
  basicAuth,
  eventIdParam(),
  reviewIdParam(),
  handleValidation,
  deleteReviewController
);

export default router;
