process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
process.env.DB_NAME = process.env.DB_NAME || 'ecommerce_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_please_do_not_use_in_prod';
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.RATE_LIMIT_MAX = '10000';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
process.env.PAYMENT_RATE_LIMIT_MAX = '10000';

const db = require('../config/connection');
const collections = require('../config/collections');

beforeAll((done) => {
  db.connect(done);
});

afterEach(async () => {
  const database = db.get();
  if (!database) return;

  await Promise.all([
    database.collection(collections.USER_COLLECTION).deleteMany({}),
    database.collection(collections.PRODUCT_COLLECTION).deleteMany({}),
    database.collection(collections.CART_COLLECTION).deleteMany({}),
    database.collection(collections.ORDER_COLLECTION).deleteMany({})
  ]);
});

afterAll(async () => {
  await db.close();
});
