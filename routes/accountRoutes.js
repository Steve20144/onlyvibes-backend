import { Router } from 'express';
import { basicAuth, requireRoles } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validation.js';
import {
  accountBody,
  accountUpdateBody,
  userIdParam,
  verificationBody,
  notificationBody,
  reminderBody,
  followBody,
  targetIdParam,
  notificationIdParam,
  reminderIdParam
} from '../utils/validators.js';
import {
  createAccountController,
  getAccountController,
  updateAccountController,
  deleteAccountController,
  getPreferencesController,
  updatePreferencesController,
  deletePreferencesController,
  getVerificationController,
  submitVerificationController,
  updateVerificationController,
  recommendationsController,
  followController,
  unfollowController,
  followersController,
  followingController
} from '../controllers/accountController.js';
import {
  listNotificationsController,
  createNotificationController,
  updateNotificationController,
  deleteNotificationController
} from '../controllers/notificationController.js';
import {
  listRemindersController,
  createReminderController,
  updateReminderController,
  deleteReminderController
} from '../controllers/reminderController.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.post('/', basicAuth, accountBody(), handleValidation, createAccountController);

router.get('/:userId', basicAuth, userIdParam(), handleValidation, getAccountController);
router.put(
  '/:userId',
  basicAuth,
  userIdParam(),
  accountUpdateBody(),
  handleValidation,
  updateAccountController
);
router.delete('/:userId', basicAuth, userIdParam(), handleValidation, deleteAccountController);

router.get('/:userId/preferences', basicAuth, userIdParam(), handleValidation, getPreferencesController);
router.put(
  '/:userId/preferences',
  basicAuth,
  userIdParam(),
  handleValidation,
  updatePreferencesController
);
router.delete('/:userId/preferences', basicAuth, userIdParam(), handleValidation, deletePreferencesController);

router.get(
  '/:userId/verification-request',
  basicAuth,
  userIdParam(),
  handleValidation,
  getVerificationController
);
router.post(
  '/:userId/verification-request',
  basicAuth,
  userIdParam(),
  verificationBody(),
  handleValidation,
  submitVerificationController
);
router.put(
  '/:userId/verification-request',
  basicAuth,
  userIdParam(),
  verificationBody(),
  handleValidation,
  updateVerificationController
);

router.get(
  '/:userId/recommendations',
  basicAuth,
  userIdParam(),
  handleValidation,
  recommendationsController
);

router.post(
  '/:userId/follow',
  basicAuth,
  userIdParam(),
  followBody(),
  handleValidation,
  followController
);
router.delete(
  '/:userId/follow/:targetId',
  basicAuth,
  userIdParam(),
  targetIdParam(),
  handleValidation,
  unfollowController
);
router.get(
  '/:userId/followers',
  basicAuth,
  userIdParam(),
  handleValidation,
  followersController
);
router.get(
  '/:userId/following',
  basicAuth,
  userIdParam(),
  handleValidation,
  followingController
);

router.get(
  '/:userId/notifications',
  basicAuth,
  userIdParam(),
  handleValidation,
  listNotificationsController
);
router.post(
  '/:userId/notifications',
  basicAuth,
  userIdParam(),
  notificationBody(),
  handleValidation,
  createNotificationController
);
router.put(
  '/:userId/notifications/:notificationId',
  basicAuth,
  userIdParam(),
  notificationIdParam(),
  notificationBody(),
  handleValidation,
  updateNotificationController
);
router.delete(
  '/:userId/notifications/:notificationId',
  basicAuth,
  userIdParam(),
  notificationIdParam(),
  handleValidation,
  deleteNotificationController
);

router.get(
  '/:userId/reminders',
  basicAuth,
  userIdParam(),
  handleValidation,
  listRemindersController
);
router.post(
  '/:userId/reminders',
  basicAuth,
  userIdParam(),
  reminderBody(),
  handleValidation,
  createReminderController
);
router.put(
  '/:userId/reminders/:reminderId',
  basicAuth,
  userIdParam(),
  reminderIdParam(),
  reminderBody(),
  handleValidation,
  updateReminderController
);
router.delete(
  '/:userId/reminders/:reminderId',
  basicAuth,
  userIdParam(),
  reminderIdParam(),
  handleValidation,
  deleteReminderController
);

export default router;
