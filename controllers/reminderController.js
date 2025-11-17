import { listReminders, createReminder, updateReminder, deleteReminder } from '../services/reminderService.js';
import { sendSuccess } from '../utils/responses.js';

/**
 * Lists reminders for user.
 */
export const listRemindersController = async (req, res, next) => {
  try {
    const reminders = await listReminders(req.params.userId);
    return sendSuccess(res, { data: reminders });
  } catch (error) {
    return next(error);
  }
};

/**
 * Creates reminder.
 */
export const createReminderController = async (req, res, next) => {
  try {
    const reminder = await createReminder(req.params.userId, req.body);
    return sendSuccess(res, { statusCode: 201, data: reminder, message: 'Reminder created' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates reminder.
 */
export const updateReminderController = async (req, res, next) => {
  try {
    const reminder = await updateReminder(req.params.reminderId, req.body);
    if (!reminder) {
      return sendSuccess(res, { statusCode: 404, message: 'Reminder not found' });
    }

    return sendSuccess(res, { data: reminder, message: 'Reminder updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes reminder.
 */
export const deleteReminderController = async (req, res, next) => {
  try {
    const deleted = await deleteReminder(req.params.reminderId);
    if (!deleted) {
      return sendSuccess(res, { statusCode: 404, message: 'Reminder not found' });
    }

    return sendSuccess(res, { statusCode: 204, data: null, message: 'Reminder removed' });
  } catch (error) {
    return next(error);
  }
};
