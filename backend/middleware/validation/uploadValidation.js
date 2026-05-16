const { badRequest } = require('../../utils/httpError');

const ALLOWED_IMAGE_TYPES = ['image/png'];

const hasValidImageSignature = (file) => {
  const data = file.data;
  if (!Buffer.isBuffer(data) || data.length < 12) return false;

  if (file.mimetype === 'image/png') {
    return data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
  }

  return false;
};

const validateProductImage = ({ required = false } = {}) => (req, res, next) => {
  const image = req.files?.image;

  if (!image) {
    if (required) return next(badRequest('Product image is required'));
    return next();
  }

  if (Array.isArray(image)) {
    return next(badRequest('Only one product image is allowed'));
  }

  if (!ALLOWED_IMAGE_TYPES.includes(image.mimetype)) {
    return next(badRequest('Only PNG product images are allowed'));
  }

  if (!hasValidImageSignature(image)) {
    return next(badRequest('Uploaded file is not a valid image'));
  }

  return next();
};

module.exports = {
  validateProductImage
};
