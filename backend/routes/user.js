const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validation/validate');
const { authLimiter, paymentLimiter } = require('../config/security');
const { idParams } = require('../validators/commonValidators');
const { signupBody, loginBody, verifyEmailBody, resendVerificationBody, forgotPasswordBody, resetPasswordBody } = require('../validators/authValidators');
const { productQuery } = require('../validators/productValidators');
const { cartQuantityBody } = require('../validators/cartValidators');
const { checkoutBody } = require('../validators/orderValidators');
const { paymentVerificationBody } = require('../validators/paymentValidators');
const catalogController = require('../controllers/catalogController');
const userController = require('../controllers/userController');

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Public routes
router.get('/products', validate({ query: productQuery }), catalogController.listProducts);
router.get('/products/categories', catalogController.getCategories);
router.get('/products/:id', validate({ params: idParams }), catalogController.getProductById);
router.post('/signup', authLimiter, validate({ body: signupBody }), userController.signUp);
router.post('/login', authLimiter, validate({ body: loginBody }), userController.login);
router.post('/verify-email', authLimiter, validate({ body: verifyEmailBody }), userController.verifyEmail);
router.post('/resend-verification', authLimiter, validate({ body: resendVerificationBody }), userController.resendVerification);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordBody }), userController.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordBody }), userController.resetPassword);
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', userController.logout); // logout can be public (just clears cookie) or protected. Since it just clears cookie based on cookie token, public is fine.

// Protected routes
router.post('/logout-all', authMiddleware.authenticate, userController.logoutAll);
router.get('/cart', authMiddleware.authenticate, userController.getCart);
router.post('/cart/:id', authMiddleware.authenticate, validate({ params: idParams }), userController.addToCart);
router.put('/cart/quantity', authMiddleware.authenticate, validate({ body: cartQuantityBody }), userController.changeCartProductQuantity);
router.get('/wishlist', authMiddleware.authenticate, userController.getWishlist);
router.post('/wishlist/toggle/:id', authMiddleware.authenticate, validate({ params: idParams }), userController.toggleWishlist);
router.get('/place-order', authMiddleware.authenticate, userController.getPlaceOrderSummary);
router.post('/place-order', authMiddleware.authenticate, validate({ body: checkoutBody }), userController.placeOrder);
router.get('/order-placed', authMiddleware.authenticate, userController.getOrderPlaced);
router.get('/orders', authMiddleware.authenticate, userController.getOrders);
router.get('/orders/:id/products', authMiddleware.authenticate, validate({ params: idParams }), userController.getOrderProducts);
router.patch('/orders/:id/cancel', authMiddleware.authenticate, validate({ params: idParams }), userController.cancelOrder);
router.post('/verify-payment', paymentLimiter, authMiddleware.authenticate, validate({ body: paymentVerificationBody }), userController.verifyPayment);

module.exports = router;
