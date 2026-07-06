const http = require('http');
const { MongoClient } = require('mongodb');

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
    const email = `test-expiry-${Date.now()}@example.com`;
    console.log(`Testing with email: ${email}`);
    
    console.log('1. Signing up...');
    const signupRes = await request('/api/signup', 'POST', {
      name: 'Test Expiry User',
      email,
      password: 'password123'
    });
    console.log('Signup response:', signupRes.body);
    
    // Connect to DB and force token to be expired
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('shopping');
    
    const user1 = await db.collection('users').findOne({ email });
    const originalToken = user1.verificationToken;
    console.log('\n2. Modifying DB to expire token:', originalToken);
    
    await db.collection('users').updateOne(
      { email },
      { $set: { verificationTokenExpiry: new Date(Date.now() - 10000) } } // Expired 10 seconds ago
    );
    
    console.log('\n3. Verifying expired token...');
    const verifyFailRes = await request('/api/verify-email', 'POST', {
      token: originalToken
    });
    console.log('Verify email response (should fail with expired):', verifyFailRes.body);
    
    console.log('\n4. Attempting to login (should prompt verification)...');
    const loginFailRes = await request('/api/login', 'POST', {
      email,
      password: 'password123'
    });
    console.log('Login fail response:', loginFailRes.body);
    
    console.log('\n5. Requesting resend verification...');
    const resendRes = await request('/api/resend-verification', 'POST', {
      email
    });
    console.log('Resend verification response:', resendRes.body);
    
    const user2 = await db.collection('users').findOne({ email });
    const newToken = user2.verificationToken;
    console.log('\n6. New token from DB after resend:', newToken);
    
    console.log('\n7. Verifying with new token...');
    const verifySuccessRes = await request('/api/verify-email', 'POST', {
      token: newToken
    });
    console.log('Verify email response (should succeed):', verifySuccessRes.body);
    
    console.log('\n8. Logging in after verification...');
    const loginSuccessRes = await request('/api/login', 'POST', {
      email,
      password: 'password123'
    });
    
    if (loginSuccessRes.statusCode === 200 && loginSuccessRes.body.status === true) {
      console.log('\n✅ Expiry and Resend flow tests passed successfully!');
    } else {
      console.log('\n❌ Tests failed.');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error running tests:', error);
  }
})();
