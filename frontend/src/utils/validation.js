// Validate email format
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate username (alphanumeric + underscore only)
export const validateUsername = (username) => {
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
};

// Validate password (strong)
export const validatePassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Validate task title
export const validateTaskTitle = (title) => {
  if (!title || title.length < 5 || title.length > 100) return false;
  // Only alphanumeric, spaces, and basic punctuation
  const regex = /^[a-zA-Z0-9\s\-_.,'!?()]+$/;
  return regex.test(title);
};

// Validate bounty amount
export const validateBounty = (bounty) => {
  const num = parseInt(bounty);
  return num >= 100 && num <= 100000;
};

// Validate deadline hours
export const validateDeadlineHours = (hours) => {
  const num = parseInt(hours);
  return num >= 1 && num <= 48;
};

// Escape HTML to prevent XSS
export const escapeHTML = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Remove potentially dangerous characters
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>"'`]/g, '') // Remove HTML/script chars
    .substring(0, 1000); // Limit length
};
