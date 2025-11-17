import {
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotification
} from '../services/notificationService.js';
import { sendSuccess } from '../utils/responses.js';

/**
 * Lists notifications for a user.
 */
export const listNotificationsController = async (req, res, next) => {
  try {
    const notifications = await listNotifications(req.params.userId);
    return sendSuccess(res, { data: notifications });
  } catch (error) {
    return next(error);
  }
};

/**
 * Creates a notification.
 */
export const createNotificationController = async (req, res, next) => {
  try {
    const notification = await createNotification(req.params.userId, req.body);
    return sendSuccess(res, { statusCode: 201, data: notification, message: 'Notification created' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates a notification.
 */
export const updateNotificationController = async (req, res, next) => {
  try {
    const notification = await updateNotification(req.params.notificationId, req.body);
    if (!notification) {
      return sendSuccess(res, { statusCode: 404, message: 'Notification not found' });
    }

    return sendSuccess(res, { data: notification, message: 'Notification updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes a notification.
 */
export const deleteNotificationController = async (req, res, next) => {
  try {
    const deleted = await deleteNotification(req.params.notificationId);
    if (!deleted) {
      return sendSuccess(res, { statusCode: 404, message: 'Notification not found' });
    }

    return sendSuccess(res, { statusCode: 204, data: null, message: 'Notification removed' });
  } catch (error) {
    return next(error);
  }
};
