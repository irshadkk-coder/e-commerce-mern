const { MongoClient } = require('mongodb');
const collections = require('./config/collections');

async function checkIndex() {
  const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db('shopping'); // or process.env.DB_NAME
    
    const indexes = await db.collection(collections.USER_COLLECTION).indexes();
    const otpIndex = indexes.find(idx => idx.key.otpExpiry === 1);
    
    if (otpIndex) {
      console.log(JSON.stringify(otpIndex));
    } else {
      console.log('INDEX_NOT_FOUND');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.close();
  }
}

checkIndex();
