const db = require('../config/connection');
const collections = require('../config/collections');
const { ObjectId } = require('mongodb');
const { CATEGORIES } = require('../constants/categories');
const { badRequest, notFound } = require('../utils/httpError');

const normalizeCategoryName = (name = '') => (
  String(name).trim().replace(/\s+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const collection = () => db.get().collection(collections.CATEGORY_COLLECTION);

const ensureDefaultCategories = async () => {
  const database = db.get();
  const existingCollections = await database
    .listCollections({ name: collections.CATEGORY_COLLECTION })
    .toArray();
  if (existingCollections.length > 0) return;

  const now = new Date();
  await collection().insertMany(CATEGORIES.map((name) => ({
    name,
    createdAt: now,
    updatedAt: now
  })));
};

const getCategories = async () => {
  await ensureDefaultCategories();
  return collection().find({}).sort({ name: 1 }).toArray();
};

const getCategoryNames = async () => {
  const categories = await getCategories();
  return categories.map((category) => category.name);
};

const addCategory = async (name) => {
  const normalizedName = normalizeCategoryName(name);
  if (!normalizedName) throw badRequest('Category name is required');

  const existing = await collection().findOne({ name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' } });
  if (existing) throw badRequest('Category already exists');

  const now = new Date();
  const result = await collection().insertOne({
    name: normalizedName,
    createdAt: now,
    updatedAt: now
  });

  return { _id: result.insertedId, name: normalizedName, createdAt: now, updatedAt: now };
};

const deleteCategory = async (id) => {
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) throw notFound('Category not found');
};

module.exports = {
  normalizeCategoryName,
  getCategories,
  getCategoryNames,
  addCategory,
  deleteCategory
};
