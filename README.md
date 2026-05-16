# Ecommerce Full-Stack Project

Production-oriented ecommerce application with a React/Vite frontend, Express/MongoDB backend, JWT authentication, product catalog search, cart/checkout, Razorpay payment verification, admin product management, and admin order management.

## Architecture Overview

- `frontend/`: React 18 SPA built with Vite, served in production by Nginx.
- `backend/`: Express API with controllers, services, middleware, Zod validation, JWT auth, rate limiting, Helmet, Razorpay verification, and MongoDB native driver.
- `mongo`: MongoDB database container with persistent storage.
- `docker-compose.yml`: Runs frontend, backend, and MongoDB on a shared Docker network.

Request flow in Docker:

1. Browser hits Nginx frontend at `http://localhost`.
2. Nginx serves React static files.
3. Nginx proxies `/api/*` and `/product-images/*` to the backend container.
4. Backend talks to MongoDB through the internal `mongo` service.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, React Hot Toast
- Backend: Node.js, Express, MongoDB native driver, JWT, bcrypt, Razorpay SDK
- Validation/Security: Zod, Helmet, CORS, express-rate-limit
- Testing: Jest, Supertest, Vitest, React Testing Library
- Deployment: Docker, Docker Compose, Nginx, GitHub Actions

## Environment Variables

Backend variables:

```env
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=shopping
JWT_SECRET=replace_with_a_long_random_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
PAYMENT_RATE_LIMIT_MAX=30
UPLOAD_FILE_SIZE_LIMIT=2097152
```

Frontend variables:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ASSET_BASE_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

In Docker production-style mode, the frontend uses `/api` and Nginx proxies requests to the backend.

## Local Development

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Run backend:

```bash
cd backend
npm run dev
```

Run frontend:

```bash
cd frontend
npm run dev
```

Create an admin user:

```bash
cd backend
npm run create-admin
```

## Docker Setup

Run the complete stack:

```bash
docker-compose up --build
```

Services:

- Frontend: `http://localhost`
- Backend: internal `backend:3000`, proxied through Nginx at `/api`
- MongoDB: internal `mongo:27017`

Persistent volumes:

- `mongo_data`: MongoDB database files
- `product_images`: uploaded product images

For real production, override secrets with environment variables or a secret manager:

```bash
JWT_SECRET=... RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... docker-compose up --build
```

## Testing

Backend tests:

```bash
cd backend
npm test
npm run test:coverage
```

Backend tests use Jest and Supertest against an isolated MongoDB database. They cover auth, validation, protected routes, product search/pagination, cart, checkout, Razorpay verification, and admin orders.

Frontend tests:

```bash
cd frontend
npm test
npm run test:coverage
```

Frontend tests use Vitest and React Testing Library. They cover protected routing, auth context hydration, product search/pagination UI, loading/empty states, and admin order status updates.

## CI/CD

GitHub Actions workflow: `.github/workflows/ci.yml`

CI jobs:

- Backend: install dependencies, syntax check, run Jest/Supertest integration tests with MongoDB service.
- Frontend: install dependencies, run Vitest tests, build Vite production bundle.
- Docker: verify backend and frontend Docker images build successfully.

CI fails on test, syntax, build, or Docker build errors.

## API Overview

Public:

- `GET /api/products`
- `GET /api/products/categories`
- `GET /api/products/:id`
- `POST /api/signup`
- `POST /api/login`

User protected:

- `GET /api/cart`
- `POST /api/cart/:id`
- `PUT /api/cart/quantity`
- `GET /api/place-order`
- `POST /api/place-order`
- `GET /api/orders`
- `GET /api/orders/:id/products`
- `POST /api/verify-payment`

Admin protected:

- `GET /api/admin/products`
- `POST /api/admin/products`
- `GET /api/admin/products/:id`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`

## Screenshots

Add screenshots here before publishing the portfolio:

- Home/product catalog
- Product detail
- Cart/checkout
- Admin products
- Admin orders

## Production Deployment Notes

- Replace all default secrets.
- Use a managed MongoDB provider or secured MongoDB instance.
- Use HTTPS and a real domain.
- Move product image storage to object storage such as S3, R2, or Cloudinary for scale.
- Configure backups and monitoring.
- Run `npm audit` regularly and review dependency upgrades carefully.
- Consider using a process manager or orchestrator for backend scaling outside Docker Compose.
