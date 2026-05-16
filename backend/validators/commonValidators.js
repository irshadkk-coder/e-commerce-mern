const { z } = require('zod');
const { ObjectId } = require('mongodb');

const sanitizeText = (value) => (
  typeof value === 'string' ? value.replace(/\0/g, '').trim() : value
);

const text = (field, min = 1, max = 255) => z.preprocess(
  sanitizeText,
  z.string()
    .min(min, `${field} is required`)
    .max(max, `${field} must be at most ${max} characters`)
);

const objectId = z.string().refine((value) => ObjectId.isValid(value), {
  message: 'Invalid ObjectId'
});

const idParams = z.object({
  id: objectId
});

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

module.exports = {
  text,
  objectId,
  idParams,
  paginationQuery
};
