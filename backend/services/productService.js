const db = require('../config/connection');
const collections = require('../config/collections');
const { ObjectId } = require('mongodb');
const categoryService = require('./categoryService');

const normalizeProductPayload = (product) => ({
  name: product.name,
  description: product.description,
  price: Number(product.price),
  stock: Number(product.stock || 0),
  category: categoryService.normalizeCategoryName(product.category)
});

const buildProductFilter = ({ q, category, minPrice, maxPrice } = {}) => {
  const filter = {};

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } }
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  return filter;
};

const buildSort = (sort) => {
  if (sort === 'price_asc') return { price: 1, _id: -1 };
  if (sort === 'price_desc') return { price: -1, _id: -1 };
  if (sort === 'popular') return { salesCount: -1, _id: -1 };
  return { _id: -1 };
};

const getProducts = async (query = {}) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 12);
  const skip = (page - 1) * limit;
  const filter = buildProductFilter(query);
  const sort = buildSort(query.sort);
  const collection = db.get().collection(collections.PRODUCT_COLLECTION);

  const [products, totalProducts] = await Promise.all([
    collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter)
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      totalProducts,
      totalPages: Math.max(Math.ceil(totalProducts / limit), 1)
    }
  };
};

const getAllProducts = async () => {
  return db.get().collection(collections.PRODUCT_COLLECTION).find({}).sort({ _id: -1 }).toArray();
};

const addProduct = async (product) => {
  const now = new Date();
  const result = await db.get().collection(collections.PRODUCT_COLLECTION).insertOne({
    ...normalizeProductPayload(product),
    salesCount: 0,
    createdAt: now,
    updatedAt: now
  });
  return result.insertedId;
};

const deleteProduct = async (productId) => {
  return db.get()
    .collection(collections.PRODUCT_COLLECTION)
    .deleteOne({ _id: new ObjectId(productId) });
};

const getProductById = async (productId) => {
  return db.get()
    .collection(collections.PRODUCT_COLLECTION)
    .findOne({ _id: new ObjectId(productId) });
};

const updateProduct = async (productId, productDetails) => {
  await db.get().collection(collections.PRODUCT_COLLECTION).updateOne(
    { _id: new ObjectId(productId) },
    {
      $set: {
        ...normalizeProductPayload(productDetails),
        updatedAt: new Date()
      }
    }
  );
};

const getCategories = async () => {
  return categoryService.getCategoryNames();
};

const incrementSalesCounts = async (products) => {
  if (!products?.length) return;

  const bulkUpdates = products.map((product) => ({
    updateOne: {
      filter: { _id: new ObjectId(product.item) },
      update: { $inc: { salesCount: Number(product.quantity || 1) } }
    }
  }));

  await db.get().collection(collections.PRODUCT_COLLECTION).bulkWrite(bulkUpdates);
};

module.exports = {
  getProducts,
  getAllProducts,
  addProduct,
  deleteProduct,
  getProductById,
  updateProduct,
  getCategories,
  incrementSalesCounts
};
