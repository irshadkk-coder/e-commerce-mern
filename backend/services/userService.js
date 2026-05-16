const db = require('../config/connection');
const collections = require('../config/collections');
const bcrypt = require('bcrypt');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const productService = require('./productService');
const { badRequest, conflict, notFound } = require('../utils/httpError');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  safeUser.role = safeUser.role || 'user';
  return safeUser;
};

const userIdFilter = (userId) => ({
  $or: [
    { userId: new ObjectId(userId) },
    { userid: new ObjectId(userId) }
  ]
});

const signUp = async (userData) => {
  const existingUser = await db.get()
    .collection(collections.USER_COLLECTION)
    .findOne({ email: userData.email });

  if (existingUser) {
    return { status: false, message: 'Email already registered' };
  }

  const signupData = {
    name: userData.name,
    email: userData.email,
    password: await bcrypt.hash(userData.password, 10),
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.get().collection(collections.USER_COLLECTION).insertOne(signupData);
  const user = { ...signupData, _id: result.insertedId };

  return { status: true, user: sanitizeUser(user) };
};

const login = async (credentials) => {
  const user = await db.get()
    .collection(collections.USER_COLLECTION)
    .findOne({ email: credentials.email });

  if (!user) return { status: false, message: 'Invalid email or password' };

  const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
  if (!isPasswordValid) return { status: false, message: 'Invalid email or password' };

  return { status: true, user };
};

const addToCart = async (productId, userId) => {
  const cartCollection = db.get().collection(collections.CART_COLLECTION);
  const productObject = { item: new ObjectId(productId), quantity: 1 };

  const product = await db.get()
    .collection(collections.PRODUCT_COLLECTION)
    .findOne({ _id: new ObjectId(productId) });

  if (!product) throw notFound('Product not found');

  const userCart = await cartCollection.findOne({ user: new ObjectId(userId) });

  if (!userCart) {
    await cartCollection.insertOne({ user: new ObjectId(userId), products: [productObject] });
    return;
  }

  const productIndex = userCart.products.findIndex(
    (productItem) => productItem.item.toString() === productId
  );

  if (productIndex !== -1) {
    await cartCollection.updateOne(
      { user: new ObjectId(userId), 'products.item': new ObjectId(productId) },
      { $inc: { 'products.$.quantity': 1 } }
    );
    return;
  }

  await cartCollection.updateOne(
    { user: new ObjectId(userId) },
    { $push: { products: productObject } }
  );
};

const getCartProducts = async (userId) => {
  return db.get()
    .collection(collections.CART_COLLECTION)
    .aggregate([
      { $match: { user: new ObjectId(userId) } },
      { $unwind: '$products' },
      { $project: { item: '$products.item', quantity: '$products.quantity' } },
      {
        $lookup: {
          from: collections.PRODUCT_COLLECTION,
          localField: 'item',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] } } }
    ])
    .toArray();
};

const getCartCount = async (userId) => {
  const cart = await db.get()
    .collection(collections.CART_COLLECTION)
    .findOne({ user: new ObjectId(userId) });
  return cart ? cart.products.reduce((sum, product) => sum + Number(product.quantity || 0), 0) : 0;
};

const changeProductQuantity = async (details, userId) => {
  const count = Number(details.count);
  const quantity = Number(details.quantity);

  if (count === -1 && quantity === 1) {
    await db.get().collection(collections.CART_COLLECTION).updateOne(
      { user: new ObjectId(userId) },
      { $pull: { products: { item: new ObjectId(details.product) } } }
    );
    return { removeProduct: true };
  }

  await db.get().collection(collections.CART_COLLECTION).updateOne(
    { user: new ObjectId(userId), 'products.item': new ObjectId(details.product) },
    { $inc: { 'products.$.quantity': count } }
  );

  return { status: true };
};

const getTotalAmount = async (userId) => {
  const total = await db.get()
    .collection(collections.CART_COLLECTION)
    .aggregate([
      { $match: { user: new ObjectId(userId) } },
      { $unwind: '$products' },
      { $project: { item: '$products.item', quantity: '$products.quantity' } },
      {
        $lookup: {
          from: collections.PRODUCT_COLLECTION,
          localField: 'item',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$quantity', { $toDouble: '$product.price' }] } }
        }
      }
    ])
    .toArray();

  return total[0]?.total || 0;
};

const getCartProductList = async (userId) => {
  const cart = await db.get()
    .collection(collections.CART_COLLECTION)
    .findOne({ user: new ObjectId(userId) });
  return cart?.products || [];
};

const placeOrder = async (order, products, total) => {
  if (!products.length) throw badRequest('Cart is empty');

  const isOnline = order['payment-method'] === 'ONLINE';
  const orderDocument = {
    deliveryDetails: {
      mobile: order.mobile,
      address: order.address,
      pincode: order.pincode
    },
    userId: new ObjectId(order.userId),
    paymentMethod: order['payment-method'],
    paymentStatus: isOnline ? 'pending' : 'cod',
    products,
    totalAmount: Number(total),
    date: new Date(),
    status: isOnline ? 'pending' : 'paid',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.get().collection(collections.ORDER_COLLECTION).insertOne(orderDocument);

  if (!isOnline) {
    await db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) });
    await productService.incrementSalesCounts(products);
  }

  return result.insertedId;
};

const getUserOrders = async (userId) => {
  return db.get()
    .collection(collections.ORDER_COLLECTION)
    .find(userIdFilter(userId))
    .sort({ date: -1 })
    .toArray();
};

const getOrderProducts = async (orderId, userId) => {
  const order = await db.get()
    .collection(collections.ORDER_COLLECTION)
    .findOne({
      _id: new ObjectId(orderId),
      ...userIdFilter(userId)
    });

  if (!order || !order.products || order.products.length === 0) return [];

  const productIds = order.products.map((p) => new ObjectId(p.item));
  const products = await db.get()
    .collection(collections.PRODUCT_COLLECTION)
    .find({ _id: { $in: productIds } })
    .toArray();

  return order.products.map((p) => {
    const product = products.find((prod) => prod._id.toString() === p.item.toString());
    return { ...p, product };
  });
};

const generateRazorpay = async (orderId, total, userId) => {
  const order = await new Promise((resolve, reject) => {
    razorpay.orders.create(
      { amount: Math.round(Number(total) * 100), currency: 'INR', receipt: String(orderId) },
      (err, razorpayOrder) => {
        if (err) return reject(err);
        return resolve(razorpayOrder);
      }
    );
  });

  await db.get().collection(collections.ORDER_COLLECTION).updateOne(
    { _id: new ObjectId(orderId), ...userIdFilter(userId) },
    {
      $set: {
        razorpayOrderId: order.id,
        razorpayAmount: order.amount,
        razorpayCurrency: order.currency,
        paymentStatus: 'created',
        updatedAt: new Date()
      }
    }
  );

  return order;
};

const verifyPayment = async (details, userId) => {
  const { payment, order } = details;
  const orderId = order.receipt;
  const dbOrder = await db.get().collection(collections.ORDER_COLLECTION).findOne({
    _id: new ObjectId(orderId),
    ...userIdFilter(userId)
  });

  if (!dbOrder) throw notFound('Order not found');
  if (dbOrder.paymentMethod !== 'ONLINE') throw badRequest('Order is not an online payment order');
  if (dbOrder.paymentStatus === 'paid' || dbOrder.status === 'paid') {
    throw conflict('Payment has already been verified');
  }
  if (dbOrder.razorpayOrderId !== payment.razorpay_order_id) {
    throw badRequest('Payment order mismatch');
  }

  const payload = `${payment.razorpay_order_id}|${payment.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(payment.razorpay_signature);
  const isValid = expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!isValid) {
    await db.get().collection(collections.ORDER_COLLECTION).updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: 'failed',
          paymentFailureReason: 'Signature mismatch',
          updatedAt: new Date()
        }
      }
    );
    throw badRequest('Payment verification failed');
  }

  const paymentUpdate = await db.get().collection(collections.ORDER_COLLECTION).updateOne(
    { _id: new ObjectId(orderId), paymentStatus: { $ne: 'paid' } },
    {
      $set: {
        status: 'paid',
        paymentStatus: 'paid',
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
        paidAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  if (paymentUpdate.modifiedCount === 0) {
    throw conflict('Payment has already been verified');
  }

  await db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new ObjectId(userId) });
  await productService.incrementSalesCounts(dbOrder.products);

  return { orderId, status: 'paid' };
};

module.exports = {
  signUp,
  login,
  addToCart,
  getCartProducts,
  getCartCount,
  changeProductQuantity,
  getTotalAmount,
  getCartProductList,
  placeOrder,
  getUserOrders,
  getOrderProducts,
  generateRazorpay,
  verifyPayment,
  sanitizeUser
};
