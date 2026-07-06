const { MongoClient, ObjectId } = require('mongodb');
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
async function run() {
  await client.connect();
  const db = client.db('shopping');
  
  const cart = await db.collection('carts').findOne({ "products.0": { $exists: true } });
  if (!cart) {
    console.log("No cart with products found");
    client.close();
    return;
  }
  console.log('Testing with cart user:', cart.user);
  
  const products = await db.collection('carts').aggregate([
    { $match: { user: cart.user } },
    { $unwind: '$products' },
    { $project: { item: '$products.item', quantity: '$products.quantity' } },
    {
      $lookup: {
        from: 'products',
        localField: 'item',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] } } }
  ]).toArray();
  
  console.log('Result length:', products.length);
  if(products.length > 0) {
     console.log('Has product field?', !!products[0].product);
     console.log('product:', products[0].product);
  }
  
  client.close();
}
run();
