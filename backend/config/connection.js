const { MongoClient } = require('mongodb');
const { ensureIndexes } = require('./indexes');
const logger = require('../utils/logger');

const state = { db: null, client: null };

module.exports.connect = function (done) {
  const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const dbname = process.env.DB_NAME || 'shopping';

  const client = new MongoClient(url);

  client.connect()
    .then(async () => {
      state.client = client;
      state.db = client.db(dbname);
      await ensureIndexes(state.db);
      logger.info(`MongoDB connected to "${dbname}"`);
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
