const request = require('supertest');
const app = require('../app');

describe('auth API', () => {
  test('signup creates a user and login returns a JWT', async () => {
    const signup = await request(app)
      .post('/api/signup')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(signup.body.status).toBe(true);
    expect(signup.body.user.password).toBeUndefined();

    const login = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    expect(login.body.status).toBe(true);
    expect(login.body.token).toEqual(expect.any(String));
  });

  test('validation rejects invalid signup payloads', async () => {
    const response = await request(app)
      .post('/api/signup')
      .send({ name: 'A', email: 'not-email', password: 'short' })
      .expect(400);

    expect(response.body.status).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  test('protected route requires JWT', async () => {
    const response = await request(app).get('/api/cart').expect(401);
    expect(response.body.message).toMatch(/token/i);
  });
});
