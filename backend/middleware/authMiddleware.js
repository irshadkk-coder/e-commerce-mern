const tokenService = require('../services/tokenService');
const { failure } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return failure(res, 'Authorization token is required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = tokenService.verifyToken(token);
    return next();
  } catch (err) {
    return failure(res, 'Invalid or expired token', 401);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return failure(res, 'Admin access required', 403);
  }

  return next();
};

module.exports = {
  authenticate,
  requireAdmin
};
