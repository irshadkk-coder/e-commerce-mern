const success = (res, data = {}, statusCode = 200) => (
  res.status(statusCode).json({
    status: true,
    ...data
  })
);

const failure = (res, message, statusCode = 500, details) => (
  res.status(statusCode).json({
    status: false,
    message,
    ...(details ? { errors: details } : {})
  })
);

module.exports = {
  success,
  failure
};
