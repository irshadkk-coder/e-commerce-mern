require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const userId = new ObjectId().toString(); // NEW USER!

const token = jwt.sign(
  {
    userId: userId,
    email: 'newuser@example.com',
    name: 'New User',
    role: 'user'
  },
  JWT_SECRET,
  { expiresIn: '15m' }
);

async function run() {
  try {
    const productId = '6a0722dcde37434851a281f6'; // valid product
    
    console.log('Adding to cart for new user...');
    const addRes = await axios.post(`http://localhost:3000/api/cart/${productId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Add response:', addRes.data);
    
    console.log('Fetching cart...');
    const getRes = await axios.get('http://localhost:3000/api/cart', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Cart data:', JSON.stringify(getRes.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}
run();
