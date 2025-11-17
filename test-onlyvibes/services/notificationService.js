import { isDatabaseConnected } from '../config/database.js';
import { NotificationModel } from '../models/Notification.js';
import { mockDb, addMockItem, updateMockItem, deleteMockItem } from '../data/mockData.js';

const useDatabase = () => isDatabaseConnected();

/**
 * Lists notifications for a user.
 * @param {string} userId
 */
export const listNotifications = async (userId) => {
  if (useDatabase()) {
    return NotificationModel.find({ userId }).lean();
  }

  return mockDb.notifications.filter((notification) => notification.userId === userId);
};

/**
 * Creates a notification message.
 * @param {string} userId
 * @param {object} payload
 */
export const createNotification = async (userId, payload) => {
  if (useDatabase()) {
    const created = await NotificationModel.create({ userId, ...payload });
    return created.toObject();
  }

  return addMockItem('notifications', { userId, ...payload });
};

/**
 * Updates a notification by id.
 * @param {string} notificationId
 * @param {object} updates
 */
export const updateNotification = async (notificationId, updates) => {
  if (useDatabase()) {
    return NotificationModel.findByIdAndUpdate(notificationId, updates, { new: true }).lean();
  }

  return updateMockItem('notifications', notificationId, updates);
};

/**
 * Deletes a notification by id.
 * @param {string} notificationId
 */
export const deleteNotification = async (notificationId) => {
  if (useDatabase()) {
    const deleted = await NotificationModel.findByIdAndDelete(notificationId);
    return Boolean(deleted);
  }

  return deleteMockItem('notifications', notificationId);
};
