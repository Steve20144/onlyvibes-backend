const buildResult = (errors) => ({ isValid: errors.length === 0, errors });

const validateEventPayload = (payload = {}) => {
  const errors = [];

  if (!payload.title) {
    errors.push('title is required');
  }

  if (!payload.location) {
    errors.push('location is required');
  }

  if (!payload.date) {
    errors.push('date is required');
  } else if (Number.isNaN(Date.parse(payload.date))) {
    errors.push('date must be ISO 8601 string');
  }

  if (!payload.organizerId) {
    errors.push('organizerId is required');
  }

  return buildResult(errors);
};

const validateEventUpdate = (payload = {}) => {
  const errors = [];
  const updatableFields = [
    'title',
    'description',
    'location',
    'venue',
    'date',
    'category',
    'price',
    'capacity'
  ];

  const hasUpdates = Object.keys(payload).some((key) => updatableFields.includes(key));
  if (!hasUpdates) {
    errors.push('Provide at least one field to update');
  }

  if (payload.date && Number.isNaN(Date.parse(payload.date))) {
    errors.push('date must be ISO 8601 string');
  }

  return buildResult(errors);
};

module.exports = {
  validateEventPayload,
  validateEventUpdate
};
