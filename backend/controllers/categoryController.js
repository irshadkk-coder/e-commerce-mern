const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const categoryService = require('../services/categoryService');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories();
  return success(res, {
    categories,
    categoryNames: categories.map((category) => category.name)
  });
});

const addCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.addCategory(req.body.name);
  return success(res, { category }, 201);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  return success(res, { message: 'Category deleted' });
});

module.exports = {
  listCategories,
  addCategory,
  deleteCategory
};
