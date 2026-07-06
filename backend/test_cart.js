const { MongoClient } = require('mongodb');
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
async function run() {
  await client.connect();
  const db = client.db('shopping');
  const carts = await db.collection('carts').find({}).toArray();
  for (const c of carts) {
    console.log('cart id:', c._id);
    console.log('user type:', typeof c.user, 'constructor:', c.user?.constructor?.name);
    if (c.products.length > 0) {
      console.log('item type:', typeof c.products[0].item, 'constructor:', c.products[0].item?.constructor?.name);
    }
  }
  client.close();
}
run();
