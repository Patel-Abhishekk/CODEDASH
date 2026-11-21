const { describe, it } = require('node:test');
const assert = require('node:assert');
const { AppError, handleError } = require('../utils/errorHandler');

describe('Error Handler Utility', () => {
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

  it('should instantiate AppError with message and statusCode', () => {
    const err = new AppError('Task not found', 404);
    assert.strictEqual(err.message, 'Task not found');
    assert.strictEqual(err.statusCode, 404);
    assert.ok(err instanceof Error);
  });

  it('should respond with specific statusCode and message for operational errors', () => {
    const err = new AppError('Unauthorized access', 403);
    const res = createMockRes();

    handleError(err, res);

    assert.strictEqual(res.statusCode, 403);
    assert.deepStrictEqual(res.data, { success: false, message: 'Unauthorized access' });
  });

  it('should mask 500 internal errors safely', () => {
    const err = new Error('Database crash secret details');
    const res = createMockRes();

    handleError(err, res);

    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.data, { success: false, message: 'Internal server error' });
  });
});
