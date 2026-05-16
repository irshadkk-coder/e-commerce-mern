const { z } = require('zod');
const { paginationQuery, text } = require('./commonValidators');

const checkoutBody = z.object({
  mobile: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'A valid mobile number is required'),
  address: text('Address', 8, 500),
  pincode: z.string().trim().regex(/^[0-9A-Za-z -]{3,12}$/, 'A valid pincode is required'),
  'payment-method': z.enum(['COD', 'ONLINE'])
});

const orderStatusBody = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
});

const adminOrderQuery = paginationQuery.extend({
  status: z.enum(['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled']).optional().default('all'),
  search: z.string().trim().max(120).optional().default('')
});

module.exports = {
  checkoutBody,
  orderStatusBody,
  adminOrderQuery
};
