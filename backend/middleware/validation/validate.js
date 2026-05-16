const { ZodError } = require('zod');
const { badRequest } = require('../../utils/httpError');

const validate = (schemas = {}) => (req, res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      return next(badRequest('Validation failed', details));
    }
    return next(err);
  }
};

module.exports = validate;
