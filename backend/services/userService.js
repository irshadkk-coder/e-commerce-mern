const db = require('../config/connection');
const collections = require('../config/collections');
const bcrypt = require('bcrypt');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const productService = require('./productService');
const { badRequest, conflict, notFound } = require('../utils/httpError');
const emailService = require('../utils/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
console.log("SECRET:", process.env.RAZORPAY_KEY_SECRET ? "Loaded" : "MISSING");

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
    if (existingUser.isVerified) {
      return { status: false, message: 'An account with this email already exists. Please sign in instead.' };
    } else {
      const otp = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const updatedData = {
        name: userData.name,
        password: await bcrypt.hash(userData.password, 10),
        otp: hashedOtp,
        otpExpiry,
        otpAttempts: 0,
        updatedAt: new Date()
      };

      await db.get().collection(collections.USER_COLLECTION).updateOne(
        { _id: existingUser._id },
        { $set: updatedData }
      );
      
      const user = { ...existingUser, ...updatedData };
      await emailService.sendVerificationEmail(user.email, otp);

      return { 
        status: true, 
        message: 'Welcome back! Your account already exists but hasn\'t been verified yet. We\'ve sent you a new verification code.', 
        user: sanitizeUser(user) 
      };
    }
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const signupData = {
    name: userData.name,
    email: userData.email,
    password: await bcrypt.hash(userData.password, 10),
    role: 'user',
    isVerified: false,
    otp: hashedOtp,
    otpExpiry,
    otpAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.get().collection(collections.USER_COLLECTION).insertOne(signupData);
  const user = { ...signupData, _id: result.insertedId };

  // Send verification email
  await emailService.sendVerificationEmail(user.email, otp);

  return { status: true, user: sanitizeUser(user) };
};

const login = async (credentials) => {
  const user = await db.get()
    .collection(collections.USER_COLLECTION)
    .findOne({ email: credentials.email });

  if (!user) return { status: false, message: 'Invalid email or password' };

  const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
  if (!isPasswordValid) return { status: false, message: 'Invalid email or password' };

  if (user.isVerified === false) {
    let message = "Your account isn't verified yet. We've sent you a new OTP. Please verify your email to continue.";
    
    // Check cooldown
    if (user.updatedAt && Date.now() - new Date(user.updatedAt).getTime() < 60000) {
      message = "Your account isn't verified yet. We've recently sent you an OTP. Please verify your email to continue.";
    } else {
      const otp = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.get().collection(collections.USER_COLLECTION).updateOne(
        { _id: user._id },
        { $set: { otp: hashedOtp, otpExpiry, otpAttempts: 0, updatedAt: new Date() } }
      );
      
      await emailService.sendVerificationEmail(user.email, otp);
    }
    return { status: false, requireVerification: true, message };
  }

  return { status: true, user: sanitizeUser(user) };
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
    paymentStatus: isOnline ? 'paid' : 'cash_on_delivery',
    products,
    totalAmount: Number(total),
    date: new Date(),
    status: 'order_placed',
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
    .aggregate([
      { $match: userIdFilter(userId) },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: collections.PRODUCT_COLLECTION,
          localField: 'products.item',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $addFields: {
          products: {
            $map: {
              input: { $ifNull: ['$products', []] },
              as: 'p',
              in: {
                item: '$$p.item',
                quantity: '$$p.quantity',
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$productDetails',
                        as: 'prod',
                        cond: { $eq: ['$$prod._id', '$$p.item'] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $unset: 'productDetails'
      }
    ])
    .toArray();
};

const getLastOrderDeliveryDetails = async (userId) => {
  const lastOrder = await db.get()
    .collection(collections.ORDER_COLLECTION)
    .findOne(userIdFilter(userId), { sort: { date: -1 } });
  return lastOrder?.deliveryDetails || null;
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

const cancelOrder = async (orderId, userId) => {
  const order = await db.get().collection(collections.ORDER_COLLECTION).findOne({
    _id: new ObjectId(orderId),
    ...userIdFilter(userId)
  });

  if (!order) throw notFound('Order not found');

  if (order.status !== 'order_placed' && order.status !== 'confirmed') {
    throw badRequest('Order cannot be cancelled at this stage');
  }

  await db.get().collection(collections.ORDER_COLLECTION).updateOne(
    { _id: new ObjectId(orderId) },
    { $set: { status: 'cancelled', updatedAt: new Date() } }
  );
};

const generateRazorpay = async (total, userId) => {
  if (Number(total) <= 0) throw badRequest('Cart is empty');

  const order = await new Promise((resolve, reject) => {
    const shortUserId = String(userId).slice(-6);
    razorpay.orders.create(
      { amount: Math.round(Number(total) * 100), currency: 'INR', receipt: `c_${shortUserId}_${Date.now()}` },
      (err, razorpayOrder) => {
        if (err) {
          const msg = err.error?.description || err.message || 'Razorpay order creation failed';
          return reject(badRequest(msg));
        }
        return resolve(razorpayOrder);
      }
    );
  });

  return order;
};

const verifyPayment = async (details, userId) => {
  const { payment, order, checkout } = details;
  if (order.id !== payment.razorpay_order_id) {
    throw badRequest('Payment order mismatch');
  }

  const existingOrder = await db.get().collection(collections.ORDER_COLLECTION).findOne({
    userId: new ObjectId(userId),
    razorpayOrderId: payment.razorpay_order_id
  });

  if (existingOrder) {
    throw conflict('Payment has already been verified');
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
    throw badRequest('Payment verification failed');
  }

  const products = await getCartProductList(userId);
  const total = await getTotalAmount(userId);
  if (!products.length) throw badRequest('Cart is empty');

  const orderDocument = {
    deliveryDetails: {
      mobile: checkout.mobile,
      address: checkout.address,
      pincode: checkout.pincode
    },
    userId: new ObjectId(userId),
    paymentMethod: 'ONLINE',
    paymentStatus: 'paid',
    products,
    totalAmount: Number(total),
    date: new Date(),
    status: 'order_placed',
    razorpayOrderId: payment.razorpay_order_id,
    razorpayPaymentId: payment.razorpay_payment_id,
    razorpaySignature: payment.razorpay_signature,
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.get().collection(collections.ORDER_COLLECTION).insertOne(orderDocument);

  await db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new ObjectId(userId) });
  await productService.incrementSalesCounts(products);

  return { orderId: result.insertedId, status: 'paid' };
};

const toggleWishlist = async (productId, userId) => {
  const wishlistCollection = db.get().collection(collections.WISHLIST_COLLECTION);
  const userWishlist = await wishlistCollection.findOne({ user: new ObjectId(userId) });

  if (!userWishlist) {
    await wishlistCollection.insertOne({
      user: new ObjectId(userId),
      products: [new ObjectId(productId)]
    });
    return { added: true };
  }

  const productIndex = userWishlist.products.findIndex(
    (id) => id.toString() === productId
  );

  if (productIndex !== -1) {
    await wishlistCollection.updateOne(
      { user: new ObjectId(userId) },
      { $pull: { products: new ObjectId(productId) } }
    );
    return { added: false };
  }

  await wishlistCollection.updateOne(
    { user: new ObjectId(userId) },
    { $push: { products: new ObjectId(productId) } }
  );
  return { added: true };
};

const getWishlistProducts = async (userId) => {
  const wishlist = await db.get()
    .collection(collections.WISHLIST_COLLECTION)
    .findOne({ user: new ObjectId(userId) });
    
  if (!wishlist || !wishlist.products || wishlist.products.length === 0) return [];
  
  const products = await db.get()
    .collection(collections.PRODUCT_COLLECTION)
    .find({ _id: { $in: wishlist.products } })
    .toArray();
    
  return products;
};

const verifyEmail = async (email, otp) => {
  const user = await db.get()
    .collection(collections.USER_COLLECTION)
    .findOne({ email });

  if (!user) {
    throw badRequest('Invalid verification request');
  }

  if (user.isVerified) {
    return { status: true, message: 'Email already verified' };
  }

  if (user.otpAttempts >= 5) {
    throw badRequest('Too many incorrect attempts. A new verification code has been sent.');
  }

  if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw badRequest('Your verification code has expired. Please request a new one.');
  }

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  if (user.otp !== hashedOtp) {
    const attempts = (user.otpAttempts || 0) + 1;
    
    if (attempts >= 5) {
      const newOtp = crypto.randomInt(100000, 999999).toString();
      const newHashedOtp = crypto.createHash('sha256').update(newOtp).digest('hex');
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.get().collection(collections.USER_COLLECTION).updateOne(
        { _id: user._id },
        { $set: { otp: newHashedOtp, otpExpiry, otpAttempts: 0, updatedAt: new Date() } }
      );
      
      await emailService.sendVerificationEmail(user.email, newOtp);
      throw badRequest('Too many incorrect attempts. A new verification code has been sent.');
    } else {
      await db.get().collection(collections.USER_COLLECTION).updateOne(
        { _id: user._id },
        { $inc: { otpAttempts: 1 }, $set: { updatedAt: new Date() } }
      );
      throw badRequest('The verification code is incorrect. Please try again.');
    }
  }

  await db.get().collection(collections.USER_COLLECTION).updateOne(
    { _id: user._id },
    { 
      $set: { isVerified: true, updatedAt: new Date() },
      $unset: { otp: "", otpExpiry: "", otpAttempts: "" } 
    }
  );

  return { status: true, message: 'Email verified successfully' };
};

const resendVerification = async (email) => {
  const user = await db.get()
    .collection(collections.USER_COLLECTION)
    .findOne({ email });

  // Generic success to prevent user enumeration
  if (!user || user.isVerified) {
    return { status: true, message: 'If the email is registered and unverified, a new verification link has been sent.' };
  }

  // 60-second cooldown check
  if (user.updatedAt && Date.now() - new Date(user.updatedAt).getTime() < 60000) {
    return { status: true, message: 'If the email is registered and unverified, a new verification link has been sent.' };
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.get().collection(collections.USER_COLLECTION).updateOne(
    { _id: user._id },
    { $set: { otp: hashedOtp, otpExpiry, otpAttempts: 0, updatedAt: new Date() } }
  );

  await emailService.sendVerificationEmail(email, otp);
  return { status: true, message: 'If the email is registered and unverified, a new OTP has been sent.' };
};

const forgotPassword = async (email) => {
  const user = await db.get()
    .collection(collections.USER_COLLECTION)
    .findOne({ email });

  if (!user) {
    return { status: true, message: 'If an account exists for this email, we\'ve sent password reset instructions.' };
  }

  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
  const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.get().collection(collections.USER_COLLECTION).updateOne(
    { _id: user._id },
    { $set: { resetPasswordToken: hashedToken, resetPasswordExpires, updatedAt: new Date() } }
  );

  await emailService.sendPasswordResetEmail(email, plainToken);
  return { status: true, message: 'If an account exists for this email, we\'ve sent password reset instructions.' };
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await db.get()
    .collection(collections.USER_COLLECTION)
    .findOne({ 
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

  if (!user) {
    throw badRequest('Password reset token is invalid or has expired.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.get().collection(collections.USER_COLLECTION).updateOne(
    { _id: user._id },
    { 
      $set: { password: hashedPassword, updatedAt: new Date() },
      $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
    }
  );

  return { status: true, message: 'Password has been reset successfully. You can now log in.' };
};

const saveRefreshToken = async (userId, hashedToken) => {
  await db.get().collection(collections.USER_COLLECTION).updateOne(
    { _id: new ObjectId(userId) },
    { $push: { refreshTokens: hashedToken } }
  );
};

const verifyAndRotateRefreshToken = async (userId, oldHashedToken, newHashedToken) => {
  const result = await db.get().collection(collections.USER_COLLECTION).updateOne(
    { _id: new ObjectId(userId), refreshTokens: oldHashedToken },
    { $set: { "refreshTokens.$": newHashedToken } }
  );
  if (result.modifiedCount === 0) {
    throw badRequest('Invalid refresh token');
  }
};

const removeRefreshToken = async (userId, hashedToken) => {
  await db.get().collection(collections.USER_COLLECTION).updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { refreshTokens: hashedToken } }
  );
};

const removeAllRefreshTokens = async (userId) => {
  await db.get().collection(collections.USER_COLLECTION).updateOne(
    { _id: new ObjectId(userId) },
    { $set: { refreshTokens: [] } }
  );
};

module.exports = {
  signUp,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  saveRefreshToken,
  verifyAndRotateRefreshToken,
  removeRefreshToken,
  removeAllRefreshTokens,
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
  sanitizeUser,
  getLastOrderDeliveryDetails,
  cancelOrder,
  toggleWishlist,
  getWishlistProducts
};
