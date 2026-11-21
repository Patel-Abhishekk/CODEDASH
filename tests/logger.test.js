const { describe, it } = require('node:test');
const assert = require('node:assert');
const logger = require('../utils/logger');

describe('Structured Logger', () => {
  it('should log info messages and return entry', () => {
    const entry = logger.info('Test info message', { test: true });
    assert.strictEqual(entry.level, 'INFO');
    assert.strictEqual(entry.message, 'Test info message');
    assert.ok(entry.timestamp);
    assert.deepStrictEqual(entry.data, { test: true });
  });

  it('should log warn messages', () => {
    const entry = logger.warn('Test warning');
    assert.strictEqual(entry.level, 'WARN');
    assert.strictEqual(entry.message, 'Test warning');
  });

  it('should log error messages with Error objects', () => {
    const err = new Error('Test failure');
    const entry = logger.error('Error occurred', err);
    assert.strictEqual(entry.level, 'ERROR');
    assert.strictEqual(entry.data.message, 'Test failure');
    assert.ok(entry.data.stack);
  });
});
