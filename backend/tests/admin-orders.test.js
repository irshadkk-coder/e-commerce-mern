const request = require('supertest');
const app = require('../app');
const { createUser, createProduct, createOnlineOrder } = require('./helpers/testData');

describe('admin order API', () => {
  test('requires admin authorization', async () => {
    const { token } = await createUser({ role: 'user' });

    await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  test('admin can list and update orders', async () => {
    const { user } = await createUser({ role: 'user', email: 'buyer@example.com' });
    const { token: adminToken } = await createUser({ role: 'admin', email: 'admin@example.com' });
    const product = await createProduct();
    const order = await createOnlineOrder(user._id, product._id);

    const list = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'order_placed', page: 1, limit: 10 })
      .expect(200);

    expect(list.body.orders).toHaveLength(1);

    const update = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' })
      .expect(200);

    expect(update.body.order.status).toBe('shipped');
  });
});
