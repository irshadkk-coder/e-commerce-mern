const collections = require('./collections');

const ensureIndexes = async (database) => {
  await Promise.all([
    database.collection(collections.USER_COLLECTION).createIndex({ email: 1 }, { unique: true }),
    database.collection(collections.PRODUCT_COLLECTION).createIndex({ category: 1 }),
    database.collection(collections.PRODUCT_COLLECTION).createIndex({ name: 'text', description: 'text', category: 'text' }),
    database.collection(collections.CART_COLLECTION).createIndex({ user: 1 }, { unique: true }),
    database.collection(collections.ORDER_COLLECTION).createIndex({ userId: 1 }),
    database.collection(collections.ORDER_COLLECTION).createIndex({ userid: 1 }),
    database.collection(collections.ORDER_COLLECTION).createIndex({ status: 1 }),
    database.collection(collections.ORDER_COLLECTION).createIndex({ date: -1 }),
    database.collection(collections.ORDER_COLLECTION).createIndex({ razorpayOrderId: 1 }, { sparse: true })
  ]);
};

module.exports = {
  ensureIndexes
};
