// Validate email
const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

// Validate username
const validateUsername = (username) => {
  if (typeof username !== 'string') return false;
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!regex.test(username.trim())) return false;
  
  // Check not in blacklist
  const blacklist = ['admin', 'root', 'system', 'support'];
  return !blacklist.includes(username.trim().toLowerCase());
};

// Validate password strength
const validatePassword = (password) => {
  if (typeof password !== 'string') return false;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Sanitize input (strips dangerous HTML/script characters)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>"'`]/g, '')
    .substring(0, 1000);
};

// Escape special regex characters to prevent ReDoS & NoSQL regex injection
const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Validate task title
const validateTaskTitle = (title) => {
  if (typeof title !== 'string') return false;
  const trimmed = title.trim();
  if (trimmed.length < 5 || trimmed.length > 100) return false;
  const regex = /^[a-zA-Z0-9\s\-_.,'!?()]+$/;
  return regex.test(trimmed);
};

// Validate bounty (strictly integer between 100 and 100000)
const validateBounty = (bounty) => {
  const num = Number(bounty);
  return Number.isInteger(num) && num >= 100 && num <= 100000;
};

// Validate deadline hours (strictly integer between 1 and 48)
const validateDeadlineHours = (hours) => {
  const num = Number(hours);
  return Number.isInteger(num) && num >= 1 && num <= 48;
};

// Validate rating (strictly integer between 1 and 5)
const validateRating = (rating) => {
  const num = Number(rating);
  return Number.isInteger(num) && num >= 1 && num <= 5;
};

// Recursively sanitize objects against NoSQL injection ($ and . operator keys)
const sanitizeMongoQuery = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeMongoQuery);
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Strip MongoDB operator keys
    }
    clean[key] = (value && typeof value === 'object') ? sanitizeMongoQuery(value) : value;
  }
  return clean;
};

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeInput,
  escapeRegex,
  validateTaskTitle,
  validateBounty,
  validateDeadlineHours,
  validateRating,
  sanitizeMongoQuery
};
