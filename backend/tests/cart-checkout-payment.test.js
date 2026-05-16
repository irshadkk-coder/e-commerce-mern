const request = require('supertest');
const { ObjectId } = require('mongodb');
const app = require('../app');
const db = require('../config/connection');
const collections = require('../config/collections');
const {
  createUser,
  createProduct,
  createOnlineOrder,
  razorpaySignature
} = require('./helpers/testData');

describe('cart, checkout, and payment API', () => {
  test('adds, updates, and removes a cart item', async () => {
    const { token } = await createUser();
    const product = await createProduct();

    await request(app)
      .post(`/api/cart/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    let cart = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(cart.body.products[0].quantity).toBe(1);

    await request(app)
      .put('/api/cart/quantity')
      .set('Authorization', `Bearer ${token}`)
      .send({ product: String(product._id), count: 1, quantity: 1 })
      .expect(200);

    cart = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(cart.body.products[0].quantity).toBe(2);

    await request(app)
      .put('/api/cart/quantity')
      .set('Authorization', `Bearer ${token}`)
      .send({ product: String(product._id), count: -1, quantity: 1 })
      .expect(200);
  });

  test('places a COD order and clears cart', async () => {
    const { token } = await createUser();
    const product = await createProduct();

    await request(app)
      .post(`/api/cart/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const response = await request(app)
      .post('/api/place-order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mobile: '9999999999',
        address: '123 Test Street',
        pincode: '600001',
        'payment-method': 'COD'
      })
      .expect(201);

    expect(response.body.successCOD).toBe(true);
    expect(response.body.orderId).toEqual(expect.any(String));
  });

  test('verifies Razorpay payment once and rejects duplicate verification', async () => {
    const { user, token } = await createUser();
    const product = await createProduct();
    const order = await createOnlineOrder(user._id, product._id);
    await db.get().collection(collections.CART_COLLECTION).insertOne({
      user: new ObjectId(user._id),
      products: [{ item: new ObjectId(product._id), quantity: 1 }]
    });

    const paymentId = 'pay_test_123';
    const payload = {
      payment: {
        razorpay_order_id: order.razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: razorpaySignature(order.razorpayOrderId, paymentId)
      },
      order: {
        id: order.razorpayOrderId,
        receipt: String(order._id),
        amount: order.razorpayAmount,
        currency: 'INR'
      }
    };

    const response = await request(app)
      .post('/api/verify-payment')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(response.body.payment.status).toBe('paid');

    await request(app)
      .post('/api/verify-payment')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(409);
  });

  test('rejects invalid payment signatures safely', async () => {
    const { user, token } = await createUser();
    const product = await createProduct();
    const order = await createOnlineOrder(user._id, product._id);

    const response = await request(app)
      .post('/api/verify-payment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        payment: {
          razorpay_order_id: order.razorpayOrderId,
          razorpay_payment_id: 'pay_bad',
          razorpay_signature: 'bad_signature_bad_signature'
        },
        order: {
          id: order.razorpayOrderId,
          receipt: String(order._id),
          amount: order.razorpayAmount,
          currency: 'INR'
        }
      })
      .expect(400);

    expect(response.body.status).toBe(false);
  });
});
