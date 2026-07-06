const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const db = require('../../config/connection');
const collections = require('../../config/collections');
const tokenService = require('../../services/tokenService');

const createUser = async ({ role = 'user', email = `${role}-${Date.now()}@example.com` } = {}) => {
  const user = {
    name: role === 'admin' ? 'Admin User' : 'Test User',
    email,
    password: await bcrypt.hash('password123', 10),
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.get().collection(collections.USER_COLLECTION).insertOne(user);
  const savedUser = { ...user, _id: result.insertedId };
  return {
    user: savedUser,
    token: tokenService.createToken(savedUser)
  };
};

const createProduct = async (overrides = {}) => {
  const product = {
    name: 'Mechanical Keyboard',
    description: 'A durable keyboard for testing',
    category: 'Accessories',
    price: 1999,
    salesCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };

  const result = await db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product);
  return { ...product, _id: result.insertedId };
};

const createOnlineOrder = async (userId, productId, overrides = {}) => {
  const order = {
    deliveryDetails: {
      mobile: '9999999999',
      address: '123 Test Street',
      pincode: '600001'
    },
    userId: new ObjectId(userId),
    paymentMethod: 'ONLINE',
    paymentStatus: 'paid',
    products: [{ item: new ObjectId(productId), quantity: 1 }],
    totalAmount: 1999,
    date: new Date(),
    status: 'order_placed',
    razorpayOrderId: 'order_test_123',
    razorpayAmount: 199900,
    razorpayCurrency: 'INR',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };

  const result = await db.get().collection(collections.ORDER_COLLECTION).insertOne(order);
  return { ...order, _id: result.insertedId };
};

const razorpaySignature = (orderId, paymentId) => (
  crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
);

module.exports = {
  createUser,
  createProduct,
  createOnlineOrder,
  razorpaySignature
};
