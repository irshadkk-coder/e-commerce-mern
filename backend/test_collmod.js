const { MongoClient } = require('mongodb');
const collections = require('./config/collections');

async function testCollMod() {
  const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db('shopping');
    const users = db.collection(collections.USER_COLLECTION);
    
    // Create with 86400
    await users.createIndex({ otpExpiry: 1 }, { expireAfterSeconds: 86400 });
    
    // Try to create with 3600, it should fail
    try {
      await users.createIndex({ otpExpiry: 1 }, { expireAfterSeconds: 3600 });
    } catch (err) {
      console.log("Expected error code:", err.code); // Should be 85
      
      if (err.code === 85) {
        await db.command({
          collMod: collections.USER_COLLECTION,
          index: {
            keyPattern: { otpExpiry: 1 },
            expireAfterSeconds: 3600
          }
        });
        console.log("Successfully updated via collMod!");
      }
    }
    
    const indexes = await users.indexes();
    const otpIndex = indexes.find(idx => idx.key.otpExpiry === 1);
    console.log("Final index options:", otpIndex.expireAfterSeconds);
    
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.close();
  }
}

testCollMod();
