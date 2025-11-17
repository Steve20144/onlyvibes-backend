const buildResult = (errors) => ({ isValid: errors.length === 0, errors });

const ensureArray = (value) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const validateReviewCreate = (payload = {}) => {
  const errors = [];

  if (!payload.userId) {
    errors.push('userId is required');
  }

  if (typeof payload.rating === 'undefined') {
    errors.push('rating is required');
  } else if (typeof payload.rating !== 'number' || payload.rating < 1 || payload.rating > 5) {
    errors.push('rating must be a number between 1 and 5');
  }

  if (payload.media && !Array.isArray(payload.media)) {
    errors.push('media must be an array');
  }

  return buildResult(errors);
};

const validateReviewUpdate = (payload = {}) => {
  const errors = [];
  const allowedFields = ['rating', 'comment', 'media'];
  const hasAllowedField = Object.keys(payload).some((key) => allowedFields.includes(key));

  if (!hasAllowedField) {
    errors.push('Provide at least one field to update');
  }

  if (typeof payload.rating !== 'undefined') {
    if (typeof payload.rating !== 'number' || payload.rating < 1 || payload.rating > 5) {
      errors.push('rating must be a number between 1 and 5');
    }
  }

  if (payload.media && !Array.isArray(payload.media)) {
    errors.push('media must be an array');
  }

  return buildResult(errors);
};

const normalizeReviewPayload = (payload) => ({
  ...payload,
  comment: payload.comment ? String(payload.comment).trim() : '',
  media: ensureArray(payload.media)
});

module.exports = {
  validateReviewCreate,
  validateReviewUpdate,
  normalizeReviewPayload
};
