const userService = require('../services/userService');
const tokenService = require('../services/tokenService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { unauthorized } = require('../utils/httpError');

const signUp = asyncHandler(async (req, res) => {
  const response = await userService.signUp(req.body);
  const statusCode = response.status ? 201 : 400;
  return res.status(statusCode).json(response);
});

const login = asyncHandler(async (req, res) => {
  const response = await userService.login(req.body);

  if (!response.status || !response.user) {
    throw unauthorized(response.message || 'Invalid email or password');
  }

  const token = tokenService.createToken(response.user);

  return success(res, {
    token,
    user: userService.sanitizeUser(response.user)
  });
});

const logout = (req, res) => {
  return success(res, {
    message: 'Logout successful. Remove the token on the client side.'
  });
};

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
  return success(res, {
    user: req.user,
    total
  });
});

const placeOrder = asyncHandler(async (req, res) => {
  const orderPayload = {
    ...req.body,
    userId: req.user.userId
  };

  const products = await userService.getCartProductList(req.user.userId);
  const totalPrice = await userService.getTotalAmount(req.user.userId);
  const orderId = await userService.placeOrder(orderPayload, products, totalPrice);

  if (req.body['payment-method'] === 'COD') {
    return success(res, {
      successCOD: true,
      succesCOD: true,
      orderId
    }, 201);
  }

  const paymentOrder = await userService.generateRazorpay(orderId, totalPrice, req.user.userId);
  return success(res, {
    order: paymentOrder,
    paymentOrder
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

module.exports = {
  signUp,
  login,
  logout,
  getCart,
  addToCart,
  changeCartProductQuantity,
  getPlaceOrderSummary,
  placeOrder,
  getOrderPlaced,
  getOrders,
  getOrderProducts,
  verifyPayment
};
