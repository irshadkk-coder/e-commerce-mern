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
    if(data) req.write(postData);
    req.end();
  });
};

(async () => {
  try {
    const email = `testotp${Date.now()}@example.com`;
    console.log(`Testing with email: ${email}`);
    
    console.log('1. Signing up...');
    const signupRes = await request('/api/signup', 'POST', {
      name: 'Test OTP User',
      email,
      password: 'password123'
    });
    console.log('Signup response:', signupRes.body);
    
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('shopping');
    
    const knownOtp = "123456";
    const hashedOtp = crypto.createHash('sha256').update(knownOtp).digest('hex');
    
    await db.collection('users').updateOne(
      { email },
      { $set: { otp: hashedOtp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000), otpAttempts: 0 } }
    );
    
    console.log('\n2. Verifying with INVALID OTP...');
    const verifyFailRes = await request('/api/verify-email', 'POST', {
      email,
      otp: "654321"
    });
    console.log('Verify email fail response:', verifyFailRes.body);
    
    const userAfterFail = await db.collection('users').findOne({ email });
    console.log('Attempts should be 1:', userAfterFail.otpAttempts);
    
    console.log('\n3. Verifying with VALID OTP...');
    const verifySuccessRes = await request('/api/verify-email', 'POST', {
      email,
      otp: knownOtp
    });
    console.log('Verify email success response:', verifySuccessRes.body);
    
    console.log('\n4. Logging in after verification...');
    const loginSuccessRes = await request('/api/login', 'POST', {
      email,
      password: 'password123'
    });
    console.log('Login success response:', loginSuccessRes.body.status);
    
    console.log('\n5. Resend OTP to test expiry...');
    await request('/api/resend-verification', 'POST', { email });
    // Reset it to expired
    await db.collection('users').updateOne(
      { email },
      { $set: { isVerified: false, otp: hashedOtp, otpExpiry: new Date(Date.now() - 10000), otpAttempts: 0 } }
    );
    
    console.log('\n6. Verifying expired OTP...');
    const verifyExpiredRes = await request('/api/verify-email', 'POST', {
      email,
      otp: knownOtp
    });
    console.log('Verify expired response:', verifyExpiredRes.body);
    
    console.log('\n7. Testing max attempts...');
    await db.collection('users').updateOne(
      { email },
      { $set: { otpExpiry: new Date(Date.now() + 10000), otpAttempts: 5 } }
    );
    const verifyMaxAttemptsRes = await request('/api/verify-email', 'POST', {
      email,
      otp: knownOtp
    });
    console.log('Verify max attempts response:', verifyMaxAttemptsRes.body);
    
    await client.close();
    console.log('\n✅ All manual backend checks complete.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
})();
