const http = require('http');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

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
    const email = `security-test-${Date.now()}@example.com`;
    console.log(`Testing with email: ${email}`);
    
    console.log('\n--- 1. Testing Validation ---');
    const verifyFailZod = await request('/api/verify-email', 'POST', { token: '' });
    console.log('Verify email with empty token (expect 400 Zod error):', verifyFailZod.statusCode, verifyFailZod.body);
    
    console.log('\n--- 2. Testing User Enumeration Prevention ---');
    const resendFake = await request('/api/resend-verification', 'POST', { email: 'fake-nonexistent@example.com' });
    console.log('Resend to fake email (expect 200 with generic success):', resendFake.statusCode, resendFake.body);
    
    console.log('\n--- 3. Testing Hashed Token Flow ---');
    const signupRes = await request('/api/signup', 'POST', {
      name: 'Security User',
      email,
      password: 'password123'
    });
    console.log('Signup response:', signupRes.statusCode);
    
    // Connect to DB to check stored token
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('shopping');
    
    // We cannot get the plain token from the backend response since we don't return it!
    // Wait, the plain token is sent via email. How do we test it programmatically without reading email?
    // We can't directly read it since it's sent to Brevo.
    // Let's modify the test to intercept or we can check the resend verification.
    // Ah, wait! The plain token is sent to the emailService. I can't easily retrieve it from DB because it's hashed!
    // Let's test if the DB token looks like a hash (64 chars hex string).
    
    const user = await db.collection('users').findOne({ email });
    const storedHash = user.verificationToken;
    console.log('Stored verification token in DB (should be a hash):', storedHash);
    
    if (storedHash && storedHash.length === 64) {
      console.log('✅ Token correctly hashed in database.');
    } else {
      console.log('❌ Token not hashed correctly in database.');
    }

    console.log('\n✅ Security checks completed! (VerifyEmail and Resend flows require manual token extraction or email access to fully end-to-end test the hashed matching programmatically).');
    
    await client.close();
  } catch (error) {
    console.error('Error running tests:', error);
  }
})();
