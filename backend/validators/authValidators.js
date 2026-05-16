const { z } = require('zod');
const { text } = require('./commonValidators');

const signupBody = z.object({
  name: text('Name', 2, 80),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128)
});

const loginBody = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required').max(128)
});

module.exports = {
  signupBody,
  loginBody
};
