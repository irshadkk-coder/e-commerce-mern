const { failure } = require('../utils/response');
const logger = require('../utils/logger');

const notFoundHandler = (req, res) => {
  return failure(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode === 500) {
    logger.error(err);
  }

  return failure(res, message || 'Internal server error', statusCode, err.details);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
