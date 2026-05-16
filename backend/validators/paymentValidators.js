const { z } = require('zod');
const { objectId } = require('./commonValidators');

const paymentVerificationBody = z.object({
  payment: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(20)
  }),
  order: z.object({
    id: z.string().optional(),
    receipt: objectId,
    amount: z.coerce.number().int().positive(),
    currency: z.string().optional()
  })
});

module.exports = {
  paymentVerificationBody
};
