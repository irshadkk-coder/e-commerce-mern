const http = require('http');

const request = (path, method, data) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(body || '{}')
        });
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

(async () => {
  try {
    const email = `test${Date.now()}@example.com`;
    console.log(`Testing with email: ${email}`);
    
    console.log('1. Signing up...');
    const signupRes = await request('/api/signup', 'POST', {
      name: 'Test User',
      email,
      password: 'password123'
    });
    console.log('Signup response:', signupRes);
    
    console.log('\n2. Attempting to log in before verification...');
    const loginFailRes = await request('/api/login', 'POST', {
      email,
      password: 'password123'
    });
    console.log('Login before verification response:', loginFailRes);
    
    // Check if MongoDB has the token
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('shopping');
    const user = await db.collection('users').findOne({ email });
    console.log('\n3. User from DB:', user);
    
    if (user && user.verificationToken) {
      console.log('\n4. Verifying email with token:', user.verificationToken);
      const verifyRes = await request('/api/verify-email', 'POST', {
        token: user.verificationToken
      });
      console.log('Verify email response:', verifyRes);
      
      console.log('\n5. Attempting to log in after verification...');
      const loginSuccessRes = await request('/api/login', 'POST', {
        email,
        password: 'password123'
      });
      console.log('Login after verification response:', loginSuccessRes);
      
      if (loginSuccessRes.statusCode === 200 && loginSuccessRes.body.status === true) {
        console.log('\n✅ All tests passed successfully!');
      } else {
        console.log('\n❌ Verification or Login failed.');
      }
    } else {
      console.log('\n❌ Verification token not found in database.');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error running tests:', error);
  }
})();
