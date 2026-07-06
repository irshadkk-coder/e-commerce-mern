require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const userId = '69f97c64074b6c50fa5cd332'; // user with 1 item already

const token = jwt.sign(
  {
    userId: userId,
    email: 'test@example.com',
    name: 'test',
    role: 'user'
  },
  JWT_SECRET,
  { expiresIn: '15m' }
);

async function run() {
  try {
    const productId = '6a0722dcde37434851a281f6';
    
    console.log('Adding to cart...');
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
