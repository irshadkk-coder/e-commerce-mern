const db = require('../config/connection');
const collections = require('../config/collections');
const { ObjectId } = require('mongodb');
const { notFound } = require('../utils/httpError');

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const buildOrderFilter = ({ status, search } = {}) => {
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    const or = [
      { 'deliveryDetails.mobile': regex },
      { 'deliveryDetails.address': regex },
      { paymentMethod: regex },
      { status: regex }
    ];

    if (ObjectId.isValid(search)) {
      or.push({ _id: new ObjectId(search) });
      or.push({ userId: new ObjectId(search) });
      or.push({ userid: new ObjectId(search) });
    }

    filter.$or = or;
  }

  return filter;
};

const listOrders = async (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 12);
  const skip = (page - 1) * limit;
  const filter = buildOrderFilter(query);
  const collection = db.get().collection(collections.ORDER_COLLECTION);

  const [orders, totalOrders] = await Promise.all([
    collection.find(filter).sort({ date: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter)
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      totalOrders,
      totalPages: Math.max(Math.ceil(totalOrders / limit), 1)
    }
  };
};

const getOrderById = async (orderId) => {
  const order = await db.get()
    .collection(collections.ORDER_COLLECTION)
    .findOne({ _id: new ObjectId(orderId) });

  if (!order) throw notFound('Order not found');

  const productIds = (order.products || []).map((product) => new ObjectId(product.item));
  const products = productIds.length
    ? await db.get().collection(collections.PRODUCT_COLLECTION).find({ _id: { $in: productIds } }).toArray()
    : [];

  return {
    ...order,
    products: (order.products || []).map((item) => ({
      ...item,
      product: products.find((product) => product._id.toString() === item.item.toString())
    }))
  };
};

const updateOrderStatus = async (orderId, status) => {
  if (!ORDER_STATUSES.includes(status)) {
    throw notFound('Unsupported order status');
  }

  const result = await db.get().collection(collections.ORDER_COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        status,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  const order = result.value || result;
  if (!order) throw notFound('Order not found');
  return order;
};

module.exports = {
  listOrders,
  getOrderById,
  updateOrderStatus,
  ORDER_STATUSES
};
