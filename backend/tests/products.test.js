const request = require('supertest');
const app = require('../app');
const { createProduct } = require('./helpers/testData');

describe('product API', () => {
  test('lists products with search, pagination, filters, and sorting', async () => {
    await createProduct({ name: 'Budget Mouse', category: 'Accessories', price: 499 });
    await createProduct({ name: 'Gaming Laptop', category: 'Computers', price: 85000 });
    await createProduct({ name: 'Gaming Keyboard', category: 'Accessories', price: 2999 });

    const response = await request(app)
      .get('/api/products')
      .query({ q: 'gaming', category: 'Accessories', page: 1, limit: 1, sort: 'price_desc' })
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].name).toBe('Gaming Keyboard');
    expect(response.body.pagination.totalProducts).toBe(1);
  });

  test('rejects invalid ObjectId product detail requests', async () => {
    const response = await request(app).get('/api/products/not-an-id').expect(400);
    expect(response.body.message).toBe('Validation failed');
  });
});
