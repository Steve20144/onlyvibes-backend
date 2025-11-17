export const USER_ROLES = Object.freeze({
  USER: 'user',
  VERIFIED_USER: 'verified_user',
  VENUE: 'venue',
  ADMIN: 'admin'
});

export const VERIFICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
});

export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
});

export const EVENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  CANCELLED: 'cancelled'
});

export const NOTIFICATION_TYPES = Object.freeze({
  REMINDER: 'reminder',
  UPDATE: 'update',
  CANCELLATION: 'cancellation'
});

export const DEFAULT_PAGINATION = Object.freeze({
  PAGE: 1,
  PAGE_SIZE: 10
});

export const RESPONSE_MESSAGES = Object.freeze({
  OK: 'Request completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized request',
  FORBIDDEN: 'You are not allowed to perform this action',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Something went wrong'
});

export const FEATURE_FLAGS = Object.freeze({
  USE_MOCK_DATA: !process.env.MONGO_URI
});
