const productService = require('../services/productService');
const categoryService = require('../services/categoryService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { notFound } = require('../utils/httpError');

const listProducts = asyncHandler(async (req, res) => {
  const { products, pagination } = await productService.getProducts(req.query);
  return success(res, { products, pagination });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategoryNames();
  return success(res, { categories });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  if (!product) throw notFound('Product not found');
  return success(res, { product });
});

module.exports = { listProducts, getCategories, getProductById };
