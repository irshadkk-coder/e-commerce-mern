const { z } = require('zod');
const { objectId } = require('./commonValidators');

const cartQuantityBody = z.object({
  cart: objectId.nullish(),
  product: objectId,
  count: z.coerce.number().int().refine((value) => value === 1 || value === -1, {
    message: 'count must be 1 or -1'
  }),
  quantity: z.coerce.number().int().min(1)
});

module.exports = {
  cartQuantityBody
};
