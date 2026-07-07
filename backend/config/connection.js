const { MongoClient } = require('mongodb');
const { ensureIndexes } = require('./indexes');
const logger = require('../utils/logger');

const state = { db: null, client: null };

module.exports.connect = function (done) {
  const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(url);

  client.connect()
    .then(async () => {
      state.client = client;
      // Use DB_NAME if provided, otherwise extract from URL (client.db()), fallback to 'shopping'
      const dbname = process.env.DB_NAME;
      state.db = dbname ? client.db(dbname) : (client.options?.dbName ? client.db() : client.db('shopping'));
      await ensureIndexes(state.db);
      logger.info(`MongoDB connected to "${state.db.databaseName}"`);
      done();
    })
    .catch((err) => {
      logger.error('Failed to connect to MongoDB', err);
      done(err);
    });
};

module.exports.get = function () {
  return state.db;
};

module.exports.close = async function () {
  if (state.client) {
    await state.client.close();
    state.client = null;
    state.db = null;
  }
};
