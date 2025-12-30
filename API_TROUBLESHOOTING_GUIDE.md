# API Troubleshooting Guide

## Common Issues and Solutions

### 1. Product Creation Internal Server Error

**Problem:** Getting 500 Internal Server Error when creating products in admin dashboard.

**Possible Causes & Solutions:**

#### A. Missing Categories
**Cause:** No categories exist in database, but category_id is required for products.

**Solution:**
1. First create categories using Postman:
```
POST {{baseUrl}}/categories
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "display_order": 1
}
```

2. Or run the setup script:
```bash
cd /home/tensorgo/inventory
./setup.sh
```

#### B. Authentication Issues
**Cause:** Invalid or missing authentication token.

**Solution:**
1. Login first to get token:
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@inventory.local",
  "password": "admin@123456"
}
```

2. Use the token in Authorization header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

#### C. Database Connection Issues
**Cause:** Database not running or connection failed.

**Solution:**
1. Check if PostgreSQL is running:
```bash
sudo systemctl status postgresql
```

2. Start PostgreSQL if not running:
```bash
sudo systemctl start postgresql
```

3. Check database connection in `.env` file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/inventory_db
```

#### D. Missing Database Tables
**Cause:** Database migrations not run.

**Solution:**
```bash
cd server
npm run migrate
npm run seed
```

### 2. Route Order Issues

**Problem:** API endpoints not working correctly.

**Cause:** Route order matters in Express. Specific routes must come before parameterized routes.

**Fixed Routes Order:**
```javascript
// Correct order
router.get('/products/search', searchProducts);  // Specific route first
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);     // Parameterized route last
```

### 3. CORS Issues

**Problem:** Frontend can't connect to backend API.

**Solution:** Ensure CORS is configured in server:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

### 4. Validation Errors

**Problem:** 400 Bad Request with validation errors.

**Common Issues:**
- Missing required fields
- Invalid data types
- Invalid foreign key references

**Example Valid Product Creation:**
```json
{
  "name": "iPhone 15",
  "sku": "IPH15-001",
  "description": "Latest iPhone model",
  "price": 999.99,
  "category_id": 1,
  "image_url": "https://example.com/image.jpg"
}
```

## Step-by-Step Debugging Process

### 1. Check Server Status
```bash
cd server
npm run dev
```
Look for any startup errors in console.

### 2. Test Basic Connectivity
```
GET {{baseUrl}}/categories
```
This should work without authentication.

### 3. Test Authentication
```
POST {{baseUrl}}/auth/login
{
  "email": "admin@inventory.local",
  "password": "admin@123456"
}
```

### 4. Check Database Data
Connect to PostgreSQL and check:
```sql
-- Check if categories exist
SELECT * FROM categories;

-- Check if users exist
SELECT id, email, role FROM users;

-- Check if roles exist
SELECT * FROM roles;
```

### 5. Test Product Creation Step by Step

#### Step 1: Create Category First
```
POST {{baseUrl}}/categories
Authorization: Bearer {{token}}
{
  "name": "Test Category",
  "description": "Test description"
}
```

#### Step 2: Create Product with Valid Category ID
```
POST {{baseUrl}}/products
Authorization: Bearer {{token}}
{
  "name": "Test Product",
  "sku": "TEST-001",
  "description": "Test product",
  "price": 99.99,
  "category_id": 1
}
```

## Environment Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] Environment variables set in `.env`
- [ ] Dependencies installed (`npm install`)
- [ ] Database migrated (`npm run migrate`)
- [ ] Initial data seeded (`npm run seed`)
- [ ] Server running (`npm run dev`)
- [ ] Categories created
- [ ] Authentication working

## Quick Fix Commands

```bash
# Complete setup
cd /home/tensorgo/inventory
./setup.sh

# Manual setup
cd server
npm install
npm run migrate
npm run seed
npm run dev

# Add test categories manually
psql -d inventory_db -c "
INSERT INTO categories (name, description, display_order, is_active) 
VALUES 
  ('Electronics', 'Electronic devices', 1, true),
  ('Clothing', 'Apparel items', 2, true),
  ('Books', 'Books and media', 3, true)
ON CONFLICT (name) DO NOTHING;
"
```

## Common Error Messages

### "category_id violates foreign key constraint"
- **Cause:** Category with provided ID doesn't exist
- **Solution:** Create category first or use existing category ID

### "Unauthorized - No token provided"
- **Cause:** Missing Authorization header
- **Solution:** Add `Authorization: Bearer {{token}}` header

### "Forbidden - Insufficient permissions"
- **Cause:** User role doesn't have required permissions
- **Solution:** Login with ADMIN or SUPER_ADMIN account

### "SKU already exists"
- **Cause:** Product with same SKU already exists
- **Solution:** Use unique SKU for each product

### "Internal server error"
- **Cause:** Various server-side issues
- **Solution:** Check server logs for specific error details

## Postman Testing Tips

1. **Use Environment Variables:** Set up variables for baseUrl, token, etc.
2. **Test Scripts:** Add scripts to save response data automatically
3. **Test Order:** Follow the logical flow (auth → categories → products)
4. **Error Handling:** Check both success and error responses
5. **Data Cleanup:** Clean up test data after testing

## Server Logs Analysis

When debugging, check server console for:
- Database connection errors
- Validation errors
- Authentication failures
- Route matching issues
- SQL query errors

Example log analysis:
```
✓ Database connected successfully
✓ Server running on port 5000
❌ Error: relation "categories" does not exist
   → Solution: Run migrations
```