import { isDatabaseConnected } from '../config/database.js';
import { ReminderModel } from '../models/Reminder.js';
import { mockDb, addMockItem, updateMockItem, deleteMockItem } from '../data/mockData.js';

const useDatabase = () => isDatabaseConnected();

/**
 * Lists reminders for user.
 * @param {string} userId
 */
export const listReminders = async (userId) => {
  if (useDatabase()) {
    return ReminderModel.find({ userId }).lean();
  }

  return mockDb.reminders.filter((reminder) => reminder.userId === userId);
};

/**
 * Creates a reminder entry.
 * @param {string} userId
 * @param {object} payload
 */
export const createReminder = async (userId, payload) => {
  if (useDatabase()) {
    const created = await ReminderModel.create({ userId, ...payload });
    return created.toObject();
  }

  return addMockItem('reminders', { userId, ...payload });
};

/**
 * Updates a reminder.
 * @param {string} reminderId
 * @param {object} updates
 */
export const updateReminder = async (reminderId, updates) => {
  if (useDatabase()) {
    return ReminderModel.findByIdAndUpdate(reminderId, updates, { new: true }).lean();
  }

  return updateMockItem('reminders', reminderId, updates);
};

/**
 * Deletes a reminder by id.
 * @param {string} reminderId
 */
export const deleteReminder = async (reminderId) => {
  if (useDatabase()) {
    const deleted = await ReminderModel.findByIdAndDelete(reminderId);
    return Boolean(deleted);
  }

  return deleteMockItem('reminders', reminderId);
};
