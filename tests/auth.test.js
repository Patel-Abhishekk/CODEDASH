const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

describe('Auth Middleware', () => {
  const secret = 'test-secret-key-12345';
  before(() => {
    process.env.JWT_SECRET = secret;
  });

  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(data) {
      this.data = data;
      return this;
    };
    return res;
  };

  it('should reject request without Authorization header', () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    authMiddleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(nextCalled, false);
  });

  it('should reject request with malformed Authorization header', () => {
    const req = { headers: { authorization: 'Basic 12345' } };
    const res = createMockRes();
    let nextCalled = false;

    authMiddleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(nextCalled, false);
  });

  it('should reject request with invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalid.token.value' } };
    const res = createMockRes();
    let nextCalled = false;

    authMiddleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(nextCalled, false);
  });

  it('should accept valid token and attach user to req', () => {
    const payload = { userId: 'user-xyz-123', email: 'test@codedash.com' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    let nextCalled = false;

    authMiddleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.ok(req.user);
    assert.strictEqual(req.user.id, 'user-xyz-123');
    assert.strictEqual(req.user.email, 'test@codedash.com');
  });
});
