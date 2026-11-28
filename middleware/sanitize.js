const { sanitizeMongoQuery } = require('../utils/validation');

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 * preventing NoSQL Injection ($ and . operator injection).
 */
const noSqlSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeMongoQuery(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeMongoQuery(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeMongoQuery(req.params);
  }
  next();
};

module.exports = noSqlSanitizer;
