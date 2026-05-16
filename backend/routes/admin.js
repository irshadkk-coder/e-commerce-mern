const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validation/validate');
const { validateProductImage } = require('../middleware/validation/uploadValidation');
const { idParams } = require('../validators/commonValidators');
const { productBody } = require('../validators/productValidators');
const { adminOrderQuery, orderStatusBody } = require('../validators/orderValidators');
const adminController = require('../controllers/adminController');

// All admin routes require authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireAdmin);

router.get('/orders', validate({ query: adminOrderQuery }), adminController.listOrders);
router.get('/orders/:id', validate({ params: idParams }), adminController.getOrder);
router.patch('/orders/:id/status', validate({ params: idParams, body: orderStatusBody }), adminController.updateOrderStatus);

router.get('/products', adminController.listProducts);
router.post('/products', validateProductImage({ required: true }), validate({ body: productBody }), adminController.addProduct);
router.get('/products/:id', validate({ params: idParams }), adminController.getProduct);
router.put('/products/:id', validate({ params: idParams, body: productBody }), validateProductImage(), adminController.updateProduct);
router.delete('/products/:id', validate({ params: idParams }), adminController.deleteProduct);

module.exports = router;
