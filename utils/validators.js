import { body, param, query } from 'express-validator';
import { USER_ROLES } from '../config/constants.js';

export const userIdParam = () => [param('userId').isString().withMessage('userId must be provided')];

export const eventIdParam = () => [param('eventId').isString().withMessage('eventId must be provided')];

export const reviewIdParam = () => [param('reviewId').isString().withMessage('reviewId must be provided')];

export const notificationIdParam = () => [param('notificationId').isString().withMessage('notificationId must be provided')];

export const reminderIdParam = () => [param('reminderId').isString().withMessage('reminderId must be provided')];
export const targetIdParam = () => [param('targetId').isString().withMessage('targetId must be provided')];

export const accountBody = () => [
  body('username').isString().notEmpty(),
  body('email').isEmail(),
  body('role').isIn(Object.values(USER_ROLES)),
  body('preferences').optional().isObject()
];

export const accountUpdateBody = () => [
  body('username').optional().isString(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(Object.values(USER_ROLES)),
  body('preferences').optional().isObject()
];

export const eventFilterQuery = () => [
  query('category').optional().isString(),
  query('location').optional().isString(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1 })
];

export const eventBody = () => [
  body('title').isString().notEmpty(),
  body('description').optional().isString(),
  body('category').isString().notEmpty(),
  body('dateTime').isISO8601(),
  // Location may be an object; validate at least that it's provided and has a name and city
  body('location').custom((val) => {
    if (!val) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'object') return !!(val.name && typeof val.name === 'string');
    return false;
  }).withMessage('location is required and must be a string or an object with a name'),
  body('location.name').optional().isString().withMessage('location.name must be a string'),
  body('location.address').optional().isString(),
  body('location.city').optional().isString(),
  body('location.country').optional().isString(),
  body('imageUrl').optional().isURL()
];

export const eventUpdateBody = () => [
  body('title').optional().isString().notEmpty(),
  body('description').optional().isString(),
  body('category').optional().isString().notEmpty(),
  body('dateTime').optional().isISO8601(),
  body('location').optional().custom((val) => {
    if (!val) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'object') return !!(val.name && typeof val.name === 'string');
    return false;
  }).withMessage('location must be a string or an object with a name'),
  body('location.name').optional().isString().withMessage('location.name must be a string'),
  body('location.address').optional().isString(),
  body('location.city').optional().isString(),
  body('location.country').optional().isString(),
  body('imageUrl').optional().isURL()
];

export const reviewBody = () => [
  body('userId').isString().withMessage('userId is required'),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString(),
  body('mediaUrls').optional().isArray()
];

export const reviewUpdateBody = () => [
  body('userId').optional().isString(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().isString(),
  body('mediaUrls').optional().isArray()
];

export const verificationBody = () => [
  body('idType').isString().notEmpty(),
  body('idNumber').isString().notEmpty(),
  body('email').isEmail(),
  body('phoneNumber').isMobilePhone().withMessage('phoneNumber must be valid'),
  body('emailVerificationToken').isString().notEmpty(),
  body('phoneVerificationCode').isString().notEmpty()
];

export const notificationBody = () => [
  body('message').isString().notEmpty(),
  body('type').optional().isString()
];

export const reminderBody = () => [
  body('eventId').isString().notEmpty(),
  body('remindAt').isISO8601(),
  body('type').isString().notEmpty()
];

export const searchQuery = () => [
  query('term').optional().isString(),
  query('resource').optional().isIn(['events', 'users', 'venues'])
];

export const followBody = () => [body('targetId').isString().withMessage('targetId is required')];
