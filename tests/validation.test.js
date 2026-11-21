const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeInput,
  validateTaskTitle,
  validateBounty,
  validateDeadlineHours
} = require('../utils/validation');

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      assert.strictEqual(validateEmail('dev@codedash.com'), true);
      assert.strictEqual(validateEmail('user.name+tag@example.org'), true);
    });

    it('should return false for invalid emails', () => {
      assert.strictEqual(validateEmail('invalid-email'), false);
      assert.strictEqual(validateEmail('@domain.com'), false);
      assert.strictEqual(validateEmail('user@'), false);
      assert.strictEqual(validateEmail(''), false);
    });
  });

  describe('validateUsername', () => {
    it('should return true for valid usernames', () => {
      assert.strictEqual(validateUsername('coder123'), true);
      assert.strictEqual(validateUsername('john_doe'), true);
    });

    it('should reject blacklisted usernames', () => {
      assert.strictEqual(validateUsername('admin'), false);
      assert.strictEqual(validateUsername('root'), false);
      assert.strictEqual(validateUsername('system'), false);
      assert.strictEqual(validateUsername('support'), false);
    });

    it('should reject too short or too long usernames', () => {
      assert.strictEqual(validateUsername('ab'), false);
      assert.strictEqual(validateUsername('a'.repeat(25)), false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      assert.strictEqual(validatePassword('StrongPass1!'), true);
      assert.strictEqual(validatePassword('P@ssw0rd2026'), true);
    });

    it('should reject weak passwords', () => {
      assert.strictEqual(validatePassword('short'), false);
      assert.strictEqual(validatePassword('alllowercase1!'), false);
      assert.strictEqual(validatePassword('ALLUPPERCASE1!'), false);
      assert.strictEqual(validatePassword('NoSpecialChar1'), false);
    });
  });

  describe('sanitizeInput', () => {
    it('should strip HTML tags and special quotes', () => {
      assert.strictEqual(sanitizeInput('<script>alert("xss")</script>'), 'scriptalert(xss)/script');
      assert.strictEqual(sanitizeInput('Clean Text'), 'Clean Text');
    });

    it('should handle non-string input safely', () => {
      assert.strictEqual(sanitizeInput(null), '');
      assert.strictEqual(sanitizeInput(undefined), '');
    });
  });

  describe('validateTaskTitle', () => {
    it('should validate title length and characters', () => {
      assert.strictEqual(validateTaskTitle('Fix React memory leak'), true);
      assert.strictEqual(validateTaskTitle('Bad'), false); // too short
      assert.strictEqual(validateTaskTitle('A'.repeat(105)), false); // too long
    });
  });

  describe('validateBounty', () => {
    it('should validate bounty range between 100 and 100000', () => {
      assert.strictEqual(validateBounty(500), true);
      assert.strictEqual(validateBounty('1000'), true);
      assert.strictEqual(validateBounty(50), false);
      assert.strictEqual(validateBounty(200000), false);
      assert.strictEqual(validateBounty('invalid'), false);
    });
  });

  describe('validateDeadlineHours', () => {
    it('should validate deadline between 1 and 48 hours', () => {
      assert.strictEqual(validateDeadlineHours(2), true);
      assert.strictEqual(validateDeadlineHours(48), true);
      assert.strictEqual(validateDeadlineHours(0), false);
      assert.strictEqual(validateDeadlineHours(50), false);
    });
  });
});
