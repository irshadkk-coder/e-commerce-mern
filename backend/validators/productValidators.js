const { z } = require('zod');
const { text, paginationQuery } = require('./commonValidators');

const productBody = z.object({
  name: text('Product name', 2, 120),
  category: text('Category', 2, 80),
  price: z.coerce.number().positive('Price must be greater than 0').max(10000000),
  description: text('Description', 5, 2000)
});

const productQuery = paginationQuery.extend({
  q: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().max(80).optional().default(''),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional().default('newest')
}).refine((query) => (
  query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice
), {
  message: 'minPrice must be less than or equal to maxPrice',
  path: ['minPrice']
});

module.exports = {
  productBody,
  productQuery
};
