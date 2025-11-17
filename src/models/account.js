const allowedRoles = ['user', 'verified-user', 'venue', 'admin'];

const isEmail = (value) => /.+@.+\..+/.test(value);

const buildResult = (errors) => ({ isValid: errors.length === 0, errors });

const validateNewAccount = (payload = {}) => {
  const errors = [];

  if (!payload.username) {
    errors.push('username is required');
  }

  if (!payload.email) {
    errors.push('email is required');
  } else if (!isEmail(payload.email)) {
    errors.push('email is invalid');
  }

  if (!payload.password) {
    errors.push('password is required');
  } else if (payload.password.length < 6) {
    errors.push('password must contain at least 6 characters');
  }

  if (payload.role && !allowedRoles.includes(payload.role)) {
    errors.push('role is not supported');
  }

  return buildResult(errors);
};

const validateAccountUpdate = (payload = {}) => {
  const errors = [];
  const updatableFields = ['username', 'email', 'password', 'preferences', 'verificationStatus', 'venueDetails'];
  const hasValidField = Object.keys(payload).some((key) => updatableFields.includes(key));

  if (!hasValidField) {
    errors.push('Provide at least one updatable field');
  }

  if (payload.email && !isEmail(payload.email)) {
    errors.push('email is invalid');
  }

  if (payload.password && payload.password.length < 6) {
    errors.push('password must contain at least 6 characters');
  }

  if (payload.role && !allowedRoles.includes(payload.role)) {
    errors.push('role is not supported');
  }

  return buildResult(errors);
};

module.exports = {
  validateNewAccount,
  validateAccountUpdate,
  allowedRoles
};
