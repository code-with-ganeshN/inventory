# Quick Start Guide - Inventory Management System

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- pnpm or npm

## Initial Setup

### 1. Database Setup

```bash
# Create database
createdb inventory

# Run migrations
psql -U your_username -d inventory -f server/src/migrations/001_init.sql
```

### 2. Server Setup

```bash
cd server

# Install dependencies
pnpm install

# Create .env file
echo "DATABASE_URL=postgresql://your_username:password@localhost:5432/inventory
JWT_SECRET=your-secret-key-change-this
NODE_ENV=development
PORT=5000" > .env

# Start server
pnpm run dev
```

The server will automatically:
- Create roles (SUPER_ADMIN, ADMIN, USER)
- Create permissions
- Create warehouse
- Setup role-permission mapping

### 3. Client Setup

```bash
cd client

# Install dependencies
pnpm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start frontend
pnpm run dev
```

## Default Routes

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Creating First Super Admin

Connect to the database and run:

```sql
-- Using bcrypt hash of "password123" (change this!)
INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active)
SELECT 'superadmin@example.com', 
       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36p4rWG2',
       'Super',
       'Admin',
       id,
       true
FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;
```

Login with:
- Email: superadmin@example.com
- Password: password123

## API Testing

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Products (Requires Auth)
```bash
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure Overview

```
inventory/
├── server/
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, validation
│   │   ├── config/            # DB config, seeds
│   │   ├── migrations/        # Database schema
│   │   └── utils/             # Helpers (JWT, password, audit)
│   └── package.json
└── client/
    ├── src/
    │   ├── store/             # Redux state
    │   ├── api/               # API clients
    │   ├── pages/             # Page components
    │   └── App.jsx
    └── package.json
```

## Key Features Implemented

### Super Admin
- ✅ User management (create, update, deactivate, lock)
- ✅ Role & permission management
- ✅ System configuration
- ✅ Audit logging and monitoring

### Admin
- ✅ Product management
- ✅ Inventory management (stock, thresholds)
- ✅ Category management
- ✅ Order management
- ✅ Supplier management

### User
- ✅ Authentication (register, login, profile)
- ✅ Product browsing with search
- ✅ Shopping cart
- ✅ Order placement and tracking

## Common Tasks

### View All Users
```bash
curl -X GET "http://localhost:5000/api/admin/users?limit=50&offset=0" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Product Name",
    "sku": "SKU-001",
    "description": "Product description",
    "price": 99.99,
    "category_id": 1
  }'
```

### Add Stock
```bash
curl -X POST http://localhost:5000/api/inventory/product/1/add-stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "warehouse_id": 1,
    "quantity": 100,
    "notes": "Initial stock"
  }'
```

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `psql -U your_username`
- Verify DATABASE_URL in .env
- Run migrations again

### JWT Error
- Make sure JWT_SECRET is set in .env
- Clear localStorage and login again

### Port Already in Use
- Server: Change PORT in .env
- Client: Vite will auto-increment port

### CORS Issues
- Check CORS is enabled in server/app.ts
- Verify VITE_API_URL in client .env

## Next Development Steps

1. Complete frontend pages for all admin features
2. Add PDF/CSV report generation
3. Implement email notifications
4. Add payment gateway integration
5. Create mobile app
6. Setup production deployment

## Support

See README_IMPLEMENTATION.md for detailed documentation of all features and endpoints.
