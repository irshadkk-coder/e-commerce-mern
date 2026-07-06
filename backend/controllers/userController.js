const userService = require('../services/userService');
const tokenService = require('../services/tokenService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { unauthorized } = require('../utils/httpError');
const crypto = require('crypto');
const db = require('../config/connection');
const { ObjectId } = require('mongodb');

const signUp = asyncHandler(async (req, res) => {
  const response = await userService.signUp(req.body);
  const statusCode = response.status ? 201 : 400;
  return res.status(statusCode).json(response);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ status: false, message: 'Email and OTP are required' });
  }
  const response = await userService.verifyEmail(email, otp);
  return success(res, response);
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ status: false, message: 'Email is required' });
  }
  const response = await userService.resendVerification(email);
  return success(res, response);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const response = await userService.forgotPassword(email);
  return success(res, response);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const response = await userService.resetPassword(token, newPassword);
  return success(res, response);
});

const login = asyncHandler(async (req, res) => {
  const response = await userService.login(req.body);

  if (!response.status || !response.user) {
    if (response.requireVerification) {
      throw forbidden(response.message, { requireVerification: true });
    }
    throw unauthorized(response.message || 'Invalid email or password');
  }

  const token = tokenService.createToken(response.user);
  const refreshTokenPlain = tokenService.createRefreshToken(response.user);
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');

  await userService.saveRefreshToken(response.user._id, hashedRefreshToken);

  res.cookie('refreshToken', refreshTokenPlain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return success(res, {
    token,
    user: userService.sanitizeUser(response.user)
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;
  if (!oldRefreshToken) {
    throw unauthorized('No refresh token provided');
  }

  let decoded;
  try {
    decoded = tokenService.verifyRefreshToken(oldRefreshToken);
  } catch (error) {
    throw unauthorized('Invalid or expired refresh token');
  }

  const user = await userService.sanitizeUser({ _id: decoded.userId }); 
  const dbUser = await db.get().collection('users').findOne({ _id: new ObjectId(decoded.userId) });
  if (!dbUser) throw unauthorized('User not found');

  const oldHashed = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
  const newRefreshTokenPlain = tokenService.createRefreshToken(dbUser);
  const newHashed = crypto.createHash('sha256').update(newRefreshTokenPlain).digest('hex');

  await userService.verifyAndRotateRefreshToken(dbUser._id, oldHashed, newHashed);

  res.cookie('refreshToken', newRefreshTokenPlain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const newAccessToken = tokenService.createToken(dbUser);

  return success(res, { token: newAccessToken });
});

const logout = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;
  if (oldRefreshToken) {
    try {
      const decoded = tokenService.verifyRefreshToken(oldRefreshToken);
      const hashedToken = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
      await userService.removeRefreshToken(decoded.userId, hashedToken);
    } catch (e) {
      // Token might be invalid or expired, just clear cookie
    }
  }

  res.clearCookie('refreshToken');
  return success(res, { message: 'Logout successful' });
});

const logoutAll = asyncHandler(async (req, res) => {
  await userService.removeAllRefreshTokens(req.user.userId);
  res.clearCookie('refreshToken');
  return success(res, { message: 'Logged out from all devices' });
});

const getCart = asyncHandler(async (req, res) => {
  const products = await userService.getCartProducts(req.user.userId);
  const totalValue = await userService.getTotalAmount(req.user.userId);

  return success(res, {
    user: req.user,
    products,
    totalValue
  });
});

const addToCart = asyncHandler(async (req, res) => {
  await userService.addToCart(req.params.id, req.user.userId);
  return success(res);
});

const changeCartProductQuantity = asyncHandler(async (req, res) => {
  const response = await userService.changeProductQuantity(req.body, req.user.userId);
  response.total = await userService.getTotalAmount(req.user.userId);
  return success(res, response);
});

const getPlaceOrderSummary = asyncHandler(async (req, res) => {
  const total = await userService.getTotalAmount(req.user.userId);
  const deliveryDetails = await userService.getLastOrderDeliveryDetails(req.user.userId);
  return success(res, {
    user: req.user,
    total,
    deliveryDetails
  });
});

const placeOrder = asyncHandler(async (req, res) => {
  const orderPayload = {
    ...req.body,
    userId: req.user.userId
  };

  const products = await userService.getCartProductList(req.user.userId);
  const totalPrice = await userService.getTotalAmount(req.user.userId);
  if (req.body['payment-method'] === 'COD') {
    const orderId = await userService.placeOrder(orderPayload, products, totalPrice);
    return success(res, {
      successCOD: true,
      succesCOD: true,
      orderId
    }, 201);
  }

  const paymentOrder = await userService.generateRazorpay(totalPrice, req.user.userId);
  return success(res, {
    order: paymentOrder,
    paymentOrder,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID
  }, 201);
});

const getOrderPlaced = (req, res) => {
  return success(res, {
    user: req.user,
    message: 'Order placed'
  });
};

const getOrders = asyncHandler(async (req, res) => {
  const orders = await userService.getUserOrders(req.user.userId);
  return success(res, {
    user: req.user,
    orders
  });
});

const getOrderProducts = asyncHandler(async (req, res) => {
  const products = await userService.getOrderProducts(req.params.id, req.user.userId);
  return success(res, {
    user: req.user,
    products
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await userService.verifyPayment(req.body, req.user.userId);
  return success(res, {
    message: 'Payment verified successfully',
    payment
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  await userService.cancelOrder(req.params.id, req.user.userId);
  return success(res, { message: 'Order cancelled successfully' });
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const response = await userService.toggleWishlist(req.params.id, req.user.userId);
  return success(res, response);
});

const getWishlist = asyncHandler(async (req, res) => {
  const products = await userService.getWishlistProducts(req.user.userId);
  return success(res, {
    user: req.user,
    products
  });
});

module.exports = {
  signUp,
  login,
  logout,
  logoutAll,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getCart,
  addToCart,
  changeCartProductQuantity,
  getPlaceOrderSummary,
  placeOrder,
  getOrderPlaced,
  getOrders,
  getOrderProducts,
  verifyPayment,
  cancelOrder,
  toggleWishlist,
  getWishlist
};
