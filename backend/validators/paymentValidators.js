const { z } = require('zod');
const { text } = require('./commonValidators');

const paymentVerificationBody = z.object({
  payment: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(20)
  }),
  order: z.object({
    id: z.string().min(1),
    receipt: z.string().min(1),
    amount: z.coerce.number().int().positive(),
    currency: z.string().optional()
  }),
  checkout: z.object({
    mobile: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'A valid mobile number is required'),
    address: text('Address', 8, 500),
    pincode: z.string().trim().regex(/^[0-9A-Za-z -]{3,12}$/, 'A valid pincode is required')
  })
});

module.exports = {
  paymentVerificationBody
};
