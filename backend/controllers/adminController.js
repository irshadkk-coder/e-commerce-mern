const productService = require('../services/productService');
const orderService = require('../services/orderService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { notFound } = require('../utils/httpError');
const path = require('path');
const fs = require('fs/promises');

const productImagePath = (productId) => path.join(__dirname, '..', 'public', 'product-images', `${productId}.png`);

const listProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts();
  return success(res, { products });
});

const addProduct = asyncHandler(async (req, res) => {
  const productId = await productService.addProduct(req.body);

  if (req.files && req.files.image) {
    await req.files.image.mv(productImagePath(productId));
  }

  return success(res, { message: 'Product created', productId }, 201);
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);

  try {
    await fs.unlink(productImagePath(req.params.id));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  return success(res, { message: 'Product deleted', productId: req.params.id });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  if (!product) throw notFound('Product not found');
  return success(res, { product });
});

const updateProduct = asyncHandler(async (req, res) => {
  await productService.updateProduct(req.params.id, req.body);

  if (req.files && req.files.image) {
    await req.files.image.mv(productImagePath(req.params.id));
  }

  return success(res, { message: 'Product updated', productId: req.params.id });
});

const listOrders = asyncHandler(async (req, res) => {
  const { orders, pagination } = await orderService.listOrders(req.query);
  return success(res, { orders, pagination });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  return success(res, { order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  return success(res, { message: 'Order status updated', order });
});

module.exports = {
  listProducts,
  addProduct,
  deleteProduct,
  getProduct,
  updateProduct,
  listOrders,
  getOrder,
  updateOrderStatus
};
