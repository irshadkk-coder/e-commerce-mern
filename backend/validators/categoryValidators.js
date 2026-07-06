const { z } = require('zod');

const categoryBody = z.object({
  name: z.string().trim().min(2, 'Category name is required').max(80)
});

module.exports = {
  categoryBody
};
