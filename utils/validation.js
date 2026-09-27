// Validate email
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate username
const validateUsername = (username) => {
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!regex.test(username)) return false;
  
  // Check not in blacklist
  const blacklist = ['admin', 'root', 'system', 'support'];
  return !blacklist.includes(username.toLowerCase());
};

// Validate password strength
const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Sanitize input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>"'`]/g, '')
    .substring(0, 1000);
};

// Validate task title
const validateTaskTitle = (title) => {
  if (!title || title.length < 5 || title.length > 100) return false;
  const regex = /^[a-zA-Z0-9\s\-_.,'!?()]+$/;
  return regex.test(title);
};

// Validate bounty
const validateBounty = (bounty) => {
  const num = parseInt(bounty);
  return !isNaN(num) && num >= 100 && num <= 100000;
};

// Validate deadline
const validateDeadlineHours = (hours) => {
  const num = parseInt(hours);
  return !isNaN(num) && num >= 1 && num <= 48;
};

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeInput,
  validateTaskTitle,
  validateBounty,
  validateDeadlineHours
};
