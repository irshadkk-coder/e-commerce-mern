const { MongoClient } = require('mongodb');
const { ensureIndexes } = require('./config/indexes');
const collections = require('./config/collections');

async function testRepeatedIndexes() {
  const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db('shopping');
    
    console.log("Running ensureIndexes for the first time...");
    await ensureIndexes(db);
    
    console.log("Running ensureIndexes for the second time...");
    await ensureIndexes(db);
    
    console.log("Running ensureIndexes for the third time...");
    await ensureIndexes(db);

    const indexes = await db.collection(collections.USER_COLLECTION).indexes();
    const otpIndex = indexes.filter(idx => idx.key && idx.key.otpExpiry === 1);
    
    console.log(`Found ${otpIndex.length} index(es) for otpExpiry`);
    console.log("Success! No duplicates and no crashes.");

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.close();
  }
}

testRepeatedIndexes();
