require('dotenv').config();
const db = require('./config/connection');
const userService = require('./services/userService');

async function run() {
  await new Promise(resolve => db.connect(resolve));
  
  const carts = await db.get().collection('carts').find({ "products.0": { $exists: true } }).toArray();
  if (carts.length === 0) {
    console.log('no carts with products');
    process.exit(0);
  }
  
  const userId = carts[0].user.toString();
  console.log('Testing with userId:', userId);
  
  try {
    const products = await userService.getCartProducts(userId);
    console.log('getCartProducts output length:', products.length);
    console.log('getCartProducts output:', JSON.stringify(products, null, 2));
    
    const total = await userService.getTotalAmount(userId);
    console.log('getTotalAmount output:', total);
  } catch (err) {
    console.error('Error:', err);
  }
  
  process.exit(0);
}
run();
